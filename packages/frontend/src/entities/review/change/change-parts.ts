import type { ChangeContent, FileDiffMetadata } from '@pierre/diffs'
import type { ChangeState } from '../model'

// The hub cuts a file's changes from git's diff (git's alignment, its hunks); Pierre draws the file from its own diff of the two versions (jsdiff's alignment, then count-mismatched blocks split by line similarity). The two cuts disagree, so the hub's list stays the review's one change set and this maps each of its changes onto the parts Pierre drew: what the replay resolves, where the change's row and span sit.

// A part's place in Pierre's parsed diff; the replayed diff keeps both indices (a resolved part turns into a context entry in place).
export type PartPosition = { hunkIndex: number; changeIndex: number }

// The parts each change owns, by change id, in diff order. A change Pierre drew inside a neighbour's part owns none.
export type ChangeParts = ReadonlyMap<string, readonly PartPosition[]>

// Both sides' lines, 1-based and half-open: an insertion has an empty range at the line it sits before.
type Region = {
	oldStart: number
	oldEnd: number
	newStart: number
	newEnd: number
}
type OwnerSpan = Region & { id: string }
type DrawnPart = Region & { position: PartPosition }
type Fit = { overlap: number; gap: number }

const STABLE_KEY = /^(?:additions|deletions):\d+:(\d+):(\d+)$/

// The stable key spells the block's counts (side:line:removed:added); a change without one spans its own side only.
function blockCounts(change: ChangeState): { removed: number; added: number } {
	const counts: (string | undefined)[] =
		change.stableKey?.match(STABLE_KEY) ?? []
	const [, removed, added] = counts
	if (removed && added)
		return { removed: Number(removed), added: Number(added) }
	const length = (change.endLine ?? change.lineNumber) - change.lineNumber + 1
	return change.side === 'additions'
		? { removed: 0, added: length }
		: { removed: length, added: 0 }
}

// A change carries its start on its own side only; between two blocks the sides move in lockstep, so the other side's start is the first one less what every block above it added net.
function ownerSpans(changes: readonly ChangeState[]): OwnerSpan[] {
	let shift = 0
	return changes
		.toSorted((a, b) => a.hunkIndex - b.hunkIndex)
		.map(change => {
			const { removed, added } = blockCounts(change)
			const oldStart =
				change.side === 'additions'
					? change.lineNumber - shift
					: change.lineNumber
			const newStart = oldStart + shift
			shift += added - removed
			return {
				id: change.id,
				oldStart,
				oldEnd: oldStart + removed,
				newStart,
				newEnd: newStart + added,
			}
		})
}

function drawnPart(part: ChangeContent, position: PartPosition): DrawnPart {
	const oldStart = part.deletionLineIndex + 1
	const newStart = part.additionLineIndex + 1
	return {
		position,
		oldStart,
		oldEnd: oldStart + part.deletions,
		newStart,
		newEnd: newStart + part.additions,
	}
}

function drawnParts(diff: FileDiffMetadata): DrawnPart[] {
	return diff.hunks.flatMap((hunk, hunkIndex) =>
		hunk.hunkContent.flatMap((part, changeIndex) =>
			part.type === 'change'
				? [drawnPart(part, { hunkIndex, changeIndex })]
				: [],
		),
	)
}

function overlap(a: [number, number], b: [number, number]): number {
	return Math.max(0, Math.min(a[1], b[1]) - Math.max(a[0], b[0]))
}

function gap(a: [number, number], b: [number, number]): number {
	return Math.max(0, b[0] - a[1], a[0] - b[1])
}

function fit(span: Region, part: Region): Fit {
	const spanOld: [number, number] = [span.oldStart, span.oldEnd]
	const spanNew: [number, number] = [span.newStart, span.newEnd]
	const partOld: [number, number] = [part.oldStart, part.oldEnd]
	const partNew: [number, number] = [part.newStart, part.newEnd]
	return {
		overlap: overlap(spanOld, partOld) + overlap(spanNew, partNew),
		gap: gap(spanOld, partOld) + gap(spanNew, partNew),
	}
}

function endsBefore(span: Region | undefined, part: Region): boolean {
	return (
		!!span && span.oldEnd <= part.oldStart && span.newEnd <= part.newStart
	)
}

function startsAfter(span: Region, part: Region): boolean {
	return span.oldStart >= part.oldEnd && span.newStart >= part.newEnd
}

function isBetter(candidate: Fit, best: Fit | undefined): boolean {
	if (!best) return true
	if (candidate.overlap !== best.overlap)
		return candidate.overlap > best.overlap
	return candidate.gap < best.gap
}

// The change sharing the most lines with the part owns it; a part sharing none (the two diffs matched a repeated line differently) goes to the nearest change. Candidates run from the last change wholly above the part to the first wholly below it.
function ownerOf(
	spans: readonly OwnerSpan[],
	from: number,
	part: Region,
): OwnerSpan | undefined {
	let best: (Fit & { span: OwnerSpan }) | undefined
	for (let index = Math.max(from - 1, 0); index < spans.length; index++) {
		const span = spans[index]
		if (!span) break
		const candidate = { span, ...fit(span, part) }
		if (isBetter(candidate, best)) best = candidate
		if (startsAfter(span, part)) break
	}
	return best?.span
}

// Every part Pierre drew goes to exactly one change, so one verdict resolves it and one row closes it: a change Pierre split keeps one row over all its parts, two changes Pierre merged into one part resolve it through the change that shares the most lines with it.
export function mapChangeParts(
	diff: FileDiffMetadata,
	changes: readonly ChangeState[],
): ChangeParts {
	const spans = ownerSpans(changes)
	const owned = new Map<string, PartPosition[]>()
	let from = 0
	for (const part of drawnParts(diff)) {
		while (endsBefore(spans[from], part)) from++
		const owner = ownerOf(spans, from, part)
		if (owner)
			owned.set(owner.id, [...(owned.get(owner.id) ?? []), part.position])
	}
	return owned
}

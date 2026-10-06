import type { FileDiffMetadata } from '@pierre/diffs'
import type { Side } from './types'

export type LineMap = {
	toDisplay(side: Side, line: number): number
	fromDisplay(side: Side, line: number): number
}

type Break = { after: number; delta: number } // raw lines > `after` shift by `delta`
type HunkPart = NonNullable<
	FileDiffMetadata['hunks'][number]['hunkContent']
>[number]
type ChangePart = Extract<HunkPart, { type: 'change' }>

export type DecidedPosition = {
	hunkIndex: number
	changeIndex: number
	status: 'accepted' | 'rejected' | 'cut'
}

const IDENTITY: LineMap = { toDisplay: (_s, l) => l, fromDisplay: (_s, l) => l }

// A decided CHANGE part shifts one side by additions - deletions; a "cut" (accepted + distilled) band vanishes from BOTH streams - everything from its first raw line compresses by exactly `dels`/`adds`.
// Even when the counts are equal - unlike the visible cases where equal means zero shift.
function pushBreak(
	breaks: Record<Side, Break[]>,
	decided: DecidedPosition,
	part: ChangePart,
): void {
	const dels = part.deletions
	const adds = part.additions
	if (decided.status === 'cut') {
		breaks.deletions.push({
			after: part.deletionLineIndex,
			delta: -dels,
		})
		breaks.additions.push({
			after: part.additionLineIndex,
			delta: -adds,
		})
		return
	}
	if (adds === dels) return
	if (decided.status === 'accepted') {
		breaks.deletions.push({
			after: part.deletionLineIndex + dels,
			delta: adds - dels,
		})
		return
	}
	breaks.additions.push({
		after: part.additionLineIndex + adds,
		delta: dels - adds,
	})
}

export function buildLineMap(
	rawDiff: FileDiffMetadata,
	decided: DecidedPosition[],
): LineMap {
	const breaks: Record<Side, Break[]> = { additions: [], deletions: [] }
	for (const d of decided) {
		const part = rawDiff.hunks
			.at(d.hunkIndex)
			?.hunkContent.at(d.changeIndex)
		if (part?.type !== 'change') continue
		pushBreak(breaks, d, part)
	}
	if (!breaks.additions.length && !breaks.deletions.length) return IDENTITY
	breaks.additions.sort((a, b) => a.after - b.after)
	breaks.deletions.sort((a, b) => a.after - b.after)
	const toDisplay = (side: Side, line: number): number => {
		let off = 0
		for (const b of breaks[side]) {
			if (b.after >= line) break
			off += b.delta
		}
		return line + off
	}
	const fromDisplay = (side: Side, line: number): number => {
		// Negative deltas (a resolved block removed lines from a side) make naive piecewise ranges overlap with phantom values, but rendered numbering is contiguous and monotone.
		// So the LAST piece whose display range contains the line is the one actually rendered there.
		const bs = breaks[side]
		let prefix = bs.reduce((sum, b) => sum + b.delta, 0)
		for (let i = bs.length - 1; i >= 0; i--) {
			const b = bs[i]
			if (!b) continue
			if (line > b.after + prefix) return line - prefix
			prefix -= b.delta
		}
		return line
	}
	return { toDisplay, fromDisplay }
}

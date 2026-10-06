import { anchorTextFor } from './contents.js'

import type { FileContents } from './contents.js'
import type { ReviewComment } from './review.js'

const DICE_PAIR_WEIGHT = 2

// Thresholds for "the same line, lightly edited": >= floor is a candidate; inside the tie window the nearest-to-old-position wins.
const BIGRAM_WIDTH = 2
const SIMILARITY_FLOOR = 0.6
const SIMILARITY_TIE = 0.05

// The reviewer's fields of a new comment, as posted by `syneva comment` / the UI composer.
export type CommentInput = {
	path: string
	side: 'additions' | 'deletions'
	lineNumber: number
	body: string
	role: 'user' | 'agent'
}

// lineNumber 0 is the file-level slot (real lines are 1-based); one rule derives the anchor stamp + placeholders so every replier agrees.
export const FILE_LEVEL_LINE = 0

export function isFileLevelLine(lineNumber: number): boolean {
	return lineNumber === FILE_LEVEL_LINE
}

export function commentAnchor(lineNumber: number): 'file' | undefined {
	if (!isFileLevelLine(lineNumber)) return undefined
	return 'file'
}

// Only finite integers >= 0: anything else would serialize to null and silently drop the comment on reload.
export function parseLineNumber(raw: unknown): number | null {
	if (typeof raw === 'undefined' || raw === null) return 1
	if (typeof raw !== 'number' && typeof raw !== 'string') return null
	const lineNumber = Number(raw)
	if (!Number.isInteger(lineNumber) || lineNumber < 0) return null
	return lineNumber
}

// The additions placeholder persists whatever was sent, so habit-side agent replies still thread-match the file comments.
export function commentSide(
	side: 'additions' | 'deletions',
	lineNumber: number,
): 'additions' | 'deletions' {
	return isFileLevelLine(lineNumber) ? 'additions' : side
}

// A comment blocks (file approval + agent handoff) exactly when it is open, reviewer-authored and not a question.
export function isRequestedChange(comment: ReviewComment): boolean {
	return (
		comment.status === 'open' &&
		comment.role !== 'agent' &&
		comment.intent !== 'question'
	)
}

// The one constructor for a freshly posted comment (live route + offline CLI reply alike): defaults, side normalization and anchor stamps are born one way.
export function newComment(
	input: CommentInput,
	contents: FileContents | undefined,
	id: string,
	now: string,
): ReviewComment {
	return {
		id,
		path: input.path,
		side: commentSide(input.side, input.lineNumber),
		lineNumber: input.lineNumber,
		body: input.body,
		createdAt: now,
		updatedAt: now,
		status: 'open',
		intent: 'note',
		role: input.role,
		anchor: commentAnchor(input.lineNumber),
		anchorText: anchorTextFor(contents, input.side, input.lineNumber),
	}
}

// Pure anchor rules only; IO sequencing lives in application/comments.ts.

// Recover open anchors after a diff rebuild: exact text at the recorded line; else the single line holding that text; else fuzzy best-effort near the old spot; only then `unanchored` - an open request blocks approval and must stay reachable, never silently dropped.
// Legacy comments without anchorText flag only when their line is provably out of range. `contentsOf` resolves a present file's on-demand contents; the caller fetches exactly the files processed, so an unresolved file reads as empty.
export function reanchorComments(
	comments: ReviewComment[],
	files: readonly { path: string }[],
	contentsOf: (path: string) => FileContents | undefined,
): ReviewComment[] {
	return comments.map(comment => reanchorComment(comment, files, contentsOf))
}

function reanchorComment(
	comment: ReviewComment,
	files: readonly { path: string }[],
	contentsOf: (path: string) => FileContents | undefined,
): ReviewComment {
	if (comment.status !== 'open' || comment.anchor === 'file') return comment
	const file = files.find(candidate => candidate.path === comment.path)
	if (!file) return comment
	return withRecoveredAnchor(comment, contentsOf(comment.path))
}

function withRecoveredAnchor(
	comment: ReviewComment,
	contents: FileContents | undefined,
): ReviewComment {
	const text =
		comment.side === 'deletions'
			? contents?.oldContents
			: contents?.newContents
	const lines = (text ?? '').split('\n')
	if (!comment.anchorText)
		return {
			...comment,
			unanchored: comment.lineNumber > lines.length,
		}
	if (lines[comment.lineNumber - 1] === comment.anchorText)
		return { ...comment, unanchored: false }
	const best = bestAnchorLine(lines, comment.anchorText, comment.lineNumber)
	// All-whitespace anchors are too thin; detach rather than guess (lines are 1-based: falsy best = none).
	if (!best || !comment.anchorText.trim())
		return { ...comment, unanchored: true }
	return shiftedAnchor(comment, best)
}

function shiftedAnchor(comment: ReviewComment, best: number): ReviewComment {
	const delta = best - comment.lineNumber
	if (typeof comment.endLine !== 'number')
		return { ...comment, lineNumber: best, unanchored: false }
	return {
		...comment,
		lineNumber: best,
		endLine: comment.endLine + delta,
		unanchored: false,
	}
}

function bestAnchorLine(
	lines: string[],
	anchorText: string,
	oldLine: number,
): number | undefined {
	const matches = matchingLines(lines, anchorText)
	if (matches.length === 1) return matches[0]
	if (matches.length > 1) return unambiguousNearest(matches, oldLine)
	return nearestSimilarLine(lines, anchorText, oldLine)
}

function matchingLines(lines: string[], anchorText: string): number[] {
	const matches: number[] = []
	for (const [index, line] of lines.entries()) {
		if (line === anchorText) matches.push(index + 1)
	}
	return matches
}

// Nearest exact match; undefined on an equidistant tie rather than a guess.
function unambiguousNearest(
	matches: number[],
	oldLine: number,
): number | undefined {
	const [closest, runnerUp] = matches.toSorted(
		(a, b) => Math.abs(a - oldLine) - Math.abs(b - oldLine),
	)
	if (!closest || !runnerUp) return closest
	if (Math.abs(closest - oldLine) === Math.abs(runnerUp - oldLine))
		return undefined
	return closest
}

// Anchor text gone verbatim: the most similar surviving line (Dice >= floor), nearest to the old position on a near-tie; undefined detaches.
function nearestSimilarLine(
	lines: string[],
	anchorText: string,
	oldLine: number,
): number | undefined {
	if (anchorText.trim() === '') return undefined
	let best: { line: number; sim: number } | undefined
	for (const [index, line] of lines.entries()) {
		const candidate = {
			line: index + 1,
			sim: lineSimilarity(line, anchorText),
		}
		if (candidate.sim < SIMILARITY_FLOOR) continue
		if (isBetterMatch(candidate, best, oldLine)) best = candidate
	}
	return best?.line
}

// Higher score wins; inside the tie window nearer the old position wins.
function isBetterMatch(
	candidate: { line: number; sim: number },
	best: { line: number; sim: number } | undefined,
	oldLine: number,
): boolean {
	if (!best) return true
	if (candidate.sim > best.sim + SIMILARITY_TIE) return true
	if (Math.abs(candidate.sim - best.sim) > SIMILARITY_TIE) return false
	return Math.abs(candidate.line - oldLine) < Math.abs(best.line - oldLine)
}

// Sørensen-Dice on character bigrams (whitespace-normalized), 0..1: cheap, good at same-line-lightly-edited.
function lineSimilarity(a: string, b: string): number {
	const left = normalizeLine(a)
	const right = normalizeLine(b)
	if (left === right) return 1
	if (left.length < BIGRAM_WIDTH || right.length < BIGRAM_WIDTH) return 0
	const leftGrams = bigramCounts(left)
	const rightGrams = bigramCounts(right)
	let shared = 0
	for (const [gram, count] of leftGrams) {
		const other = rightGrams.get(gram)
		if (other) shared += Math.min(count, other)
	}
	const total = left.length - 1 + (right.length - 1)
	return total > 0 ? (DICE_PAIR_WEIGHT * shared) / total : 0
}

function normalizeLine(line: string): string {
	return line.trim().replace(/\s+/g, ' ')
}

function bigramCounts(line: string): Map<string, number> {
	const counts = new Map<string, number>()
	for (let index = 0; index < line.length - 1; index++) {
		const gram = line.slice(index, index + BIGRAM_WIDTH)
		counts.set(gram, (counts.get(gram) ?? 0) + 1)
	}
	return counts
}

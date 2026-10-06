import { deriveChanges } from './change/change-derive'
import { deriveFlowIndex } from './change/flow-index'
import { pickCurrentFile } from './current-file'
import { cur } from './file/contents'

import type { FileDiffMetadata } from '@pierre/diffs'
import type { LineMap } from '@shared/diff-renderer/linemap'
import type { Side } from '@shared/diff-renderer/types'
import type { FlowIndex } from './change/flow-index'
import type {
	ChangeState,
	FileReviewState,
	PreviewFile,
	ReviewComment,
	ReviewFile,
	ReviewState,
} from './model'

export function flowIndex(
	state: ReviewState | null,
	opts: { distill: boolean },
): FlowIndex {
	return deriveFlowIndex(state, { distill: opts.distill })
}

export function currentFileOrNull(
	files: ReviewFile[] | undefined,
	preview: PreviewFile | null,
	fileIndex: number,
): ReviewFile | null {
	return pickCurrentFile(files, preview, fileIndex)
}

export function hasCurrentFile(
	files: ReviewFile[] | undefined,
	preview: PreviewFile | null,
	fileIndex: number,
): boolean {
	return !!currentFileOrNull(files, preview, fileIndex)
}

// Enforces the precondition - there is always a file to act on by then - rather than returning a stand-in.
export function currentFile(
	files: ReviewFile[] | undefined,
	preview: PreviewFile | null,
	fileIndex: number,
): ReviewFile {
	const file = currentFileOrNull(files, preview, fileIndex)
	if (!file) throw new Error('no current file to show')
	return file
}

export function currentChanges(
	state: ReviewState | null,
	file: ReviewFile | null,
): ChangeState[] {
	const path = file?.path
	return (state?.changes ?? []).filter(c => c.path === path)
}
export function currentComments(
	state: ReviewState | null,
	file: ReviewFile | null,
): ReviewComment[] {
	const path = file?.path
	return (state?.comments ?? []).filter(c => c.path === path)
}

// Whole-file comments are NOT skipped here: the annotation flow filters them out (they anchor to the file header), while the blockers list keeps them (a file-level change request is a blocker).
export function groupLineComments(
	comments: ReviewComment[],
): Map<string, ReviewComment[]> {
	const groups = new Map<string, ReviewComment[]>()
	for (const c of comments) {
		const key = `${c.side}:${c.lineNumber}`
		const group = groups.get(key)
		if (group) group.push(c)
		else groups.set(key, [c])
	}
	for (const group of groups.values())
		group.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
	return groups
}

// lineNumber 0 is the whole-file anchor (real lines are 1-based, so it can never collide with a
// rendered one); the persisted record stamps anchor "file" alongside it; sister copy of
// FILE_LEVEL_LINE - the UI must not import backend runtime code.
const FILE_LEVEL_LINE = 0

export function isFileComment(c: Pick<ReviewComment, 'lineNumber'>): boolean {
	return c.lineNumber === FILE_LEVEL_LINE
}

function sideLineCount(file: ReviewFile, side: ReviewComment['side']): number {
	// During render() for the current file, `cur` is loaded; otherwise return Infinity so the out-of-range fallback can't wrongly flag a thread as unanchored (the authoritative server-side `unanchored` flag is still honored by the caller).
	if (cur.path !== file.path) return Infinity
	const contents = side === 'deletions' ? cur.oldContents : cur.newContents
	if (!contents) return 0
	return contents.split('\n').length
}

// One derivation for every consumer (the diff island's thread strip and the auto-expand pass) - both must agree on which open threads are unreachable in the rendered diff.
export function isUnanchored(c: ReviewComment, file: ReviewFile): boolean {
	return c.unanchored === true || c.lineNumber > sideLineCount(file, c.side)
}

export function currentFileComments(
	state: ReviewState | null,
	file: ReviewFile | null,
): ReviewComment[] {
	return currentComments(state, file)
		.filter(isFileComment)
		.toSorted((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
}

// Mirrors the server's computeApprovedFiles so the desk and the handoff agree; questions are answered live, so they don't count.
export function fileObjections(
	state: ReviewState | null,
	path: string,
): boolean {
	const rejected = (state?.decisions ?? []).some(
		d => d.path === path && d.status === 'rejected',
	)
	const openChange = (state?.comments ?? []).some(
		c =>
			c.path === path &&
			c.status === 'open' &&
			c.role !== 'agent' &&
			c.intent !== 'question',
	)
	return rejected || openChange
}

export function fileFinished(state: ReviewState | null, path: string): boolean {
	if (!state?.reviewedFiles.includes(path)) return false
	const h = state.reviewedFileHashes?.[path]
	const file = state.files.find(f => f.path === path)
	return !!h && !!file && h === file.contentHash
}

export function fileReviewState(
	state: ReviewState | null,
	path: string,
): FileReviewState {
	if (!fileFinished(state, path)) return 'pending'
	return fileObjections(state, path) ? 'changes-requested' : 'approved'
}

export function ensureChangesFromFileDiff(
	diff: FileDiffMetadata | null | undefined,
	state: ReviewState,
	file: ReviewFile,
): void {
	if (!diff) return
	const { path } = file
	const previous = new Map(
		state.changes.filter(c => c.path === path).map(c => [c.id, c]),
	)
	const derived = deriveChanges(diff, path, state.decisions, previous)
	// The caller's live reactive store is this function's mutation target by
	// contract - the assignment IS the API, not a side effect on a borrowed parameter.
	// oxlint-disable-next-line eslint/no-param-reassign
	state.changes = state.changes.filter(c => c.path !== path).concat(derived)
}

// Refresh pending changes' display anchors from the replayed diff: the annotation for a block must sit at the line number @pierre will actually render, not the raw file line.
export function syncDisplayAnchors(
	resolved: FileDiffMetadata,
	changes: ChangeState[],
): void {
	for (const c of changes) {
		if (c.status !== 'pending') continue
		if (typeof c.changeIndex !== 'number') continue
		const hunk = resolved.hunks[c.hunkIndex]
		const part = hunk?.hunkContent[c.changeIndex]
		if (!part) continue
		if (part.type !== 'change') continue
		const lineNumber =
			(c.side === 'additions'
				? part.additionLineIndex
				: part.deletionLineIndex) + 1
		c.displayLineNumber = lineNumber
		c.displayEndLine =
			c.side === 'additions'
				? part.additionLineIndex + (part.additions || 1)
				: part.deletionLineIndex + (part.deletions || 1)
	}
}

export function toDisplayLine(
	side: Side,
	line: number,
	lineMap: LineMap | null,
): number {
	return lineMap ? lineMap.toDisplay(side, line) : line
}
export function fromDisplayLine(
	side: Side,
	line: number,
	lineMap: LineMap | null,
): number {
	return lineMap ? lineMap.fromDisplay(side, line) : line
}

import { filePathOf } from '../domain/change-blocks.js'
import {
	changeBlockContent,
	changeBlocks,
	changeStableKeyFromBlock,
} from '../domain/diff/change.js'
import { blobOid } from '../domain/identity.js'
import { hash } from '../domain/identity.js'

import { mapContentReads } from './content-reads.js'

import type {
	ChangeState,
	DiffFile,
	DiffHunk,
	DiffLine,
	ReviewFile,
} from '../domain/review.js'

// Built by assignment, not conditional spread: a measured 0-byte file keeps `size: 0`, an unmeasured committed side stays absent.
type FileFlags = { size?: number; oversized?: true }

// Fixed thresholds (PRD, not user-configurable): a real desk once held a 107 MB generated JSON whose diff rendered for minutes - any ONE of these catches that class, computable from diff + stamps alone (no committed-blob reads).
const OVERSIZED_DIFF_BYTES = 1_000_000
const OVERSIZED_CHANGED_LINES = 5_000
const OVERSIZED_FILE_BYTES = 1_000_000

// What buildDiffSource provides per mode: which working side to read, stageability, committed OIDs to harvest instead of reads.
export type DiffAssembly = {
	// Only invoked when no committed OID exists, so pr/staged desks do zero content reads.
	fetchNew: (p?: string) => Promise<string>
	isStageable: boolean
	// From `git diff --raw` (pr HEAD, staged index); absent for a working-tree side, where the working copy is hashed instead.
	newOids?: Map<string, string> | undefined
	// The new side IS the working tree, so byte size is free from the bytes read to hash; committed sides leave size unstamped.
	isWorkingSide?: boolean | undefined
}

// The reviewed path and the decision key live in ../domain/change-blocks.ts.

// The same count git's `@@ -0,0 +1,N @@` and @pierre give (drop one trailing newline); stamps a hunk-less full-file add.
function lineCount(text: string): number {
	if (!text) return 0
	const n = text.split('\n').length
	return text.endsWith('\n') ? n - 1 : n
}

function countsForHunk(hunk: DiffHunk): { added: number; removed: number } {
	let added = 0
	let removed = 0
	for (const line of hunk.lines) {
		if (line.kind === 'add') added++
		else if (line.kind === 'delete') removed++
	}
	return { added, removed }
}

function countHunkLines(hunks: readonly DiffHunk[]): {
	added: number
	removed: number
} {
	return hunks.map(countsForHunk).reduce(
		(total, counts) => ({
			added: total.added + counts.added,
			removed: total.removed + counts.removed,
		}),
		{ added: 0, removed: 0 },
	)
}

// Approximate byte length of a file's diff text from its hunks - close enough to catch a
// tab-freezing diff without retaining the per-file section.
function diffTextBytes(hunks: readonly DiffHunk[]): number {
	let bytes = 0
	for (const hunk of hunks) {
		bytes += hunk.header.length + 1
		for (const line of hunk.lines)
			bytes += Buffer.byteLength(line.text, 'utf8') + LINE_PREFIX_BYTES
	}
	return bytes
}

const LINE_PREFIX_BYTES = 2

function isOversized(
	diffBytes: number,
	changedLines: number,
	size: number | undefined,
): boolean {
	if (diffBytes > OVERSIZED_DIFF_BYTES) return true
	if (changedLines > OVERSIZED_CHANGED_LINES) return true
	return typeof size === 'number' && size > OVERSIZED_FILE_BYTES
}

function fileFlags(
	diffBytes: number,
	changedLines: number,
	size: number | undefined,
): FileFlags {
	const flags: FileFlags = {}
	if (typeof size === 'number') flags.size = size
	if (isOversized(diffBytes, changedLines, size)) flags.oversized = true
	return flags
}

function changeKindOf(
	oldPath: string | undefined,
	newPath: string | undefined,
): ReviewFile['changeKind'] {
	if (!newPath) return 'deleted'
	if (!oldPath) return 'added'
	return oldPath === newPath ? 'modified' : 'renamed'
}

// The staleness key +, for a working-tree new side, its byte size: a committed side has git's OID
// from `git diff --raw` (no read); only a working-tree side is read, and only to hash.
async function contentStamp(
	file: DiffFile,
	opts: DiffAssembly,
): Promise<{ contentHash: string; size: number | undefined }> {
	const committedOid = file.newPath
		? opts.newOids?.get(file.newPath)
		: undefined
	if (committedOid) return { contentHash: committedOid, size: undefined }
	const newContents = await opts.fetchNew(file.newPath)
	return {
		contentHash: blobOid(newContents),
		size:
			opts.isWorkingSide && file.newPath
				? Buffer.byteLength(newContents, 'utf8')
				: undefined,
	}
}

async function stampFile(
	file: DiffFile,
	opts: DiffAssembly,
): Promise<ReviewFile> {
	const { contentHash, size } = await contentStamp(file, opts)
	const { added, removed } = countHunkLines(file.hunks)
	const changeKind = changeKindOf(file.oldPath, file.newPath)
	return {
		...file,
		path: filePathOf(file),
		contentHash,
		changeKind,
		added,
		removed,
		// git -M at 100% similarity emits no hunks; a rename with edits carries hunks, so it isn't pure.
		renamePure: changeKind === 'renamed' && !file.hunks.length,
		...fileFlags(diffTextBytes(file.hunks), added + removed, size),
	}
}

// The title and stableKey are what the UI groups by and Decision keys on: derived once, here.
function changeForBlock(input: {
	filePath: string
	hunk: DiffHunk
	hunkIndex: number
	block: readonly DiffLine[]
	isStageable: boolean
}): ChangeState {
	const firstAdd = input.block.find(line => line.kind === 'add')
	const firstDelete = input.block.find(line => line.kind === 'delete')
	const stableKey = changeStableKeyFromBlock(input.block)
	const removed = input.block.filter(line => line.kind === 'delete').length
	const added = input.block.filter(line => line.kind === 'add').length
	return {
		id: `${input.filePath}:${stableKey}`,
		path: input.filePath,
		hunkIndex: input.hunkIndex,
		side: firstAdd ? 'additions' : 'deletions',
		lineNumber:
			firstAdd?.newLine ?? firstDelete?.oldLine ?? input.hunk.newStart,
		stableKey,
		stageable: input.isStageable,
		contentHash: hash(changeBlockContent(input.block)),
		title: `${removed} removed · ${added} added`,
		status: 'pending',
	}
}

function changesForFile(file: DiffFile, isStageable: boolean): ChangeState[] {
	const filePath = filePathOf(file)
	return file.hunks.flatMap((hunk, hunkIndex) =>
		changeBlocks(hunk).map(block =>
			changeForBlock({ filePath, hunk, hunkIndex, block, isStageable }),
		),
	)
}

export type AssembledDiff = { files: ReviewFile[]; changes: ChangeState[] }

// Assemble from an already-parsed diff (one parse reused from buildDiffSource), stamping lean per-file metadata and tagging changes stageable or not.
export async function assembleDiff(
	parsed: readonly DiffFile[],
	opts: DiffAssembly,
): Promise<AssembledDiff> {
	return {
		// Bounded content reads: a monorepo diff can carry thousands of files and each read holds a descriptor (content-reads.ts).
		files: await mapContentReads(parsed, file => stampFile(file, opts)),
		changes: parsed.flatMap(file => changesForFile(file, opts.isStageable)),
	}
}

// A whole-file entry (tracked-unchanged or untracked add): no hunks, no stored contents (the tab fetches on open), size free from the held bytes.
export function fileEntry(
	filePath: string,
	newContents: string,
	changeKind: 'added' | 'modified',
): ReviewFile {
	const added = changeKind === 'added' ? lineCount(newContents) : 0
	const removed = 0
	return {
		oldPath: filePath,
		newPath: filePath,
		hunks: [],
		path: filePath,
		contentHash: blobOid(newContents),
		changeKind,
		added,
		removed,
		renamePure: false,
		// Hunk-less adds (the 107 MB class) have no diff bytes to sum: changed lines + byte size flag them.
		...fileFlags(
			0,
			added + removed,
			Buffer.byteLength(newContents, 'utf8'),
		),
	}
}

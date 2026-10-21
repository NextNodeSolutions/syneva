import path from 'node:path'

import { blobOid } from '../domain/identity.js'

import { mapContentReads } from './content-reads.js'
import { fileEntry } from './diff-files.js'

import type { ChangeState, ReviewFile } from '../domain/review.js'
import type { GitPort } from './ports.js'

// Untracked files must obey the same `--path` limit the diff was taken with, or a scoped review would grow silently.
export type UntrackedScan = { root: string; path?: string | undefined }

type UntrackedEntry = { rel: string; working: string }

type UntrackedPairing = {
	moves: ReviewFile[]
	deletedPaths: Set<string>
	untrackedPaths: Set<string>
}

// `git diff` never reports untracked files, so the working review would silently drop any file the agent created but never `git add`ed; surface them as full-file additions (file mode's representation), carrying no stageable hunks.
// Whole-file Approve stages them via `git add` (/stage), which doesn't rely on rawDiff; staged mode is unaffected (untracked is never in the index).
export async function appendUntrackedFiles(
	files: ReviewFile[],
	changes: ChangeState[],
	scan: UntrackedScan,
	git: GitPort,
): Promise<void> {
	const entries = await readUntrackedEntries(scan, git)
	const pairing = await pairUntrackedMoves(scan.root, files, entries, git)
	dropPairedDeletions(files, changes, pairing.deletedPaths)
	for (const entry of entries) {
		if (pairing.untrackedPaths.has(entry.rel)) continue
		files.push(fileEntry(entry.rel, entry.working, 'added'))
	}
	files.push(...pairing.moves)
}

async function readUntrackedEntries(
	scan: UntrackedScan,
	git: GitPort,
): Promise<UntrackedEntry[]> {
	const args = ['ls-files', '--others', '--exclude-standard']
	if (scan.path) args.push('--', scan.path)
	const untracked = (await git.run(args, scan.root))
		.split(/\r?\n/)
		.filter(Boolean)
	// A file that vanished between the listing and the read (or is unreadable) reads as empty, which leaves it an ordinary full addition rather than failing the whole review.
	return await mapContentReads(untracked, async rel => ({
		rel,
		working:
			(await git.workspace.readFile(path.join(scan.root, rel))) ?? '',
	}))
}

// A plain `mv` shows as a full deletion PLUS a full untracked addition; when a deleted file's index (:0) content is byte-identical to exactly one untracked file (and that untracked to exactly one deletion), merge the halves into one rename-pure entry instead of delete+re-add.
// Any ambiguity pairs nothing; exact bytes only - a moved-AND-edited file is deliberately NOT paired (guide movedFrom). Runs before mergeReviewState's input, so a merged entry's distinct old/new paths get decision/comment migration for free; keyed by blob OID; no reads when nothing is untracked to pair.
async function pairUntrackedMoves(
	root: string,
	files: ReviewFile[],
	entries: UntrackedEntry[],
	git: GitPort,
): Promise<UntrackedPairing> {
	const pairing: UntrackedPairing = {
		moves: [],
		deletedPaths: new Set(),
		untrackedPaths: new Set(),
	}
	if (!entries.length) return pairing
	const untByOid = untrackedByOid(entries)
	// The deletion's old side lives in the index (:0); read it just to hash for pairing - not retained: the merged entry stores no contents (the tab fetches them on open).
	const delByOid = await deletionsByOid(
		root,
		files.filter(file => !file.newPath),
		git,
	)
	for (const [oid, deletions] of delByOid) {
		const untracked = untByOid.get(oid)
		if (deletions.length !== 1 || untracked?.length !== 1) continue // unique 1:1 match only
		const [deletion] = deletions
		const [entry] = untracked
		if (!deletion || !entry) continue
		pairing.moves.push(mergeMove(deletion, entry))
		pairing.deletedPaths.add(deletion.path)
		pairing.untrackedPaths.add(entry.rel)
	}
	return pairing
}

function mergeMove(deletion: ReviewFile, entry: UntrackedEntry): ReviewFile {
	return {
		path: entry.rel,
		oldPath: deletion.path,
		newPath: entry.rel,
		hunks: [],
		contentHash: blobOid(entry.working),
		changeKind: 'renamed',
		renamePure: true,
		added: 0,
		removed: 0,
		size: Buffer.byteLength(entry.working, 'utf8'),
	}
}

async function deletionsByOid(
	root: string,
	deletions: ReviewFile[],
	git: GitPort,
): Promise<Map<string, ReviewFile[]>> {
	const hashed = await mapContentReads(deletions, async deletion => ({
		deletion,
		oid: blobOid(
			await git.fileAt(root, deletion.oldPath ?? deletion.path, ':0'),
		),
	}))
	const byOid = new Map<string, ReviewFile[]>()
	for (const { deletion, oid } of hashed) pushGroup(byOid, oid, deletion)
	return byOid
}

function untrackedByOid(
	entries: UntrackedEntry[],
): Map<string, UntrackedEntry[]> {
	const byOid = new Map<string, UntrackedEntry[]>()
	for (const entry of entries) pushGroup(byOid, blobOid(entry.working), entry)
	return byOid
}

function pushGroup<Grouped>(
	groups: Map<string, Grouped[]>,
	oid: string,
	member: Grouped,
): void {
	const group = groups.get(oid)
	if (group) group.push(member)
	else groups.set(oid, [member])
}

function dropPairedDeletions(
	files: ReviewFile[],
	changes: ChangeState[],
	deletedPaths: Set<string>,
): void {
	if (!deletedPaths.size) return
	for (let i = files.length - 1; i >= 0; i--) {
		const file = files[i]
		if (!file || file.newPath) continue
		if (deletedPaths.has(file.path)) files.splice(i, 1)
	}
	for (let i = changes.length - 1; i >= 0; i--) {
		const change = changes[i]
		if (change && deletedPaths.has(change.path)) changes.splice(i, 1)
	}
}

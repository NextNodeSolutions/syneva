// Reads at a revision, shared by the base port and the working tree (the index and the working copy are revisions to them too): one file per `git show`, and the new side's blob ids of a diff in one process.
import { promises as fs } from 'node:fs'
import path from 'node:path'

import { gitStats } from '@syneva/core/domain/diff/git-stats'

import { git, runGitRaw } from './exec.js'

// By default a missing object/file degrades to "" - a vanished side becomes an add/delete rather
// than crashing; `strict` (on-demand content for a side the diff says MUST exist) rethrows so
// /file-contents can 404 with a reload hint when a rebase drops the object mid-session.
export async function fileAt(
	root: string,
	rel: string | undefined,
	ref?: string,
	isStrict = false,
): Promise<string> {
	if (!rel) return ''
	gitStats.fileReads++
	gitStats.readsInFlight++
	gitStats.peakReadsInFlight = Math.max(
		gitStats.peakReadsInFlight,
		gitStats.readsInFlight,
	)
	try {
		// Raw exec, not git(), so the trailing newline is preserved: otherwise the file looks like it has no final newline and the last line renders as a spurious diff.
		if (ref) return await runGitRaw(['show', `${ref}:${rel}`], root)
		return await fs.readFile(path.join(root, rel), 'utf8')
	} catch (error) {
		if (isStrict) throw error
		return ''
	} finally {
		gitStats.readsInFlight--
	}
}

// A blob OID git reports as all-zeros is the working-tree side of a dirty/untracked file (no stored object yet): hash the working copy locally rather than harvest.
function isZeroOid(oid: string): boolean {
	return /^0+$/.test(oid)
}

type RawDiffQuery = {
	staged?: boolean | undefined
	base?: string | undefined
	head?: string | undefined
	path?: string | undefined
}

// Harvest per-file new-side blob OIDs from `git diff --raw` in ONE process (not a `git show`
// per file), for the same args the patch diff was taken with. Only useful where the new side is
// committed (pr: HEAD; staged repo: the index) - a plain working-tree side comes back all-zeros
// and is dropped here so the caller falls back to blobOid(workingCopy). Keyed by new path (the
// rename target, since -M pairs the halves). Full 40-hex via --no-abbrev; -z tolerates spaces.
export async function rawBlobOids(
	root: string,
	query: RawDiffQuery,
): Promise<Map<string, string>> {
	const args = ['diff', '--no-ext-diff', '-M', '--raw', '-z', '--no-abbrev']
	if (query.staged) args.push('--cached')
	if (query.base) args.push(`${query.base}..${query.head ?? 'HEAD'}`)
	if (query.path) args.push('--', query.path)
	const raw = await git(args, root).catch(() => '')
	const tokens = raw.split('\0').filter(token => token.length > 0)
	const oids = new Map<string, string>()
	let index = 0
	while (index < tokens.length) {
		const meta = tokens[index]
		index++
		if (!meta || !meta.startsWith(':')) continue
		// ":<oldmode> <newmode> <oldsha> <newsha> <status>" - R/C consumes old+new paths.
		const fields: (string | undefined)[] = meta.slice(1).split(' ')
		const [, , , newOid, rawStatus] = fields
		if (rawStatus?.startsWith('R') || rawStatus?.startsWith('C')) index++ // skip the old path
		const newPath = tokens[index]
		index++
		if (newPath && newOid && !isZeroOid(newOid)) oids.set(newPath, newOid)
	}
	return oids
}

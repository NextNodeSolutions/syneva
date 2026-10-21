import path from 'node:path'

import { parseUnifiedDiff } from '../domain/diff/parse.js'

import { requireWorkingTree } from './capabilities.js'
import { assembleDiff, fileEntry } from './diff-files.js'
import { appendUntrackedFiles } from './untracked.js'

import type { DiffFile } from '../domain/review.js'
import type { AssembledDiff } from './diff-files.js'
import type { GitPort, WorkingTreePort, WorkspacePort } from './ports.js'

export type DiffSource = AssembledDiff & {
	rawDiff: string
}

export type DiffSourceQuery =
	| {
			mode: 'pr'
			root: string
			base?: string | undefined
			head?: string | undefined
	  }
	| { mode: 'file'; root: string; path: string }
	| {
			mode: 'repo'
			root: string
			path?: string | undefined
			staged?: boolean | undefined
	  }

type PrQuery = Extract<DiffSourceQuery, { mode: 'pr' }>
type FileQuery = Extract<DiffSourceQuery, { mode: 'file' }>
type RepoQuery = Extract<DiffSourceQuery, { mode: 'repo' }>

export async function buildDiffSource(
	query: DiffSourceQuery,
	git: GitPort,
): Promise<DiffSource | null> {
	if (query.mode === 'pr') return await buildPrSource(query, git)
	// Repo and file desks diff the working tree and the index; a pr desk needs only the commits.
	const tree = requireWorkingTree(git)
	if (query.mode === 'file')
		return await buildFileSource(query, git.workspace, tree)
	return await buildRepoSource(query, git, tree)
}

// pr is committed on both sides, so the file-level keys come from `git diff --raw` and assembleDiff reads no blob contents at all. The new side is `head` when given (a branch read before its checkout), else HEAD.
async function buildPrSource(
	query: PrQuery,
	git: GitPort,
): Promise<DiffSource | null> {
	const base = query.base ?? 'HEAD'
	const head = query.head ?? 'HEAD'
	const rawDiff = await git.diff(query.root, { base, head })
	if (!rawDiff.trim()) return null
	const parsedDiff = parseUnifiedDiff(rawDiff)
	const assembled = await assembleDiff(parsedDiff, {
		fetchNew: p => git.fileAt(query.root, p, head),
		isStageable: false, // verdict-only: a commit can't be staged
		newOids: await git.rawBlobOids(query.root, { base, head }),
	})
	return { ...assembled, rawDiff }
}

async function buildFileSource(
	query: FileQuery,
	workspace: WorkspacePort,
	tree: WorkingTreePort,
): Promise<DiffSource> {
	const rel = path.relative(query.root, query.path)
	const key = rel.startsWith('..') ? query.path : rel
	const tracked =
		!rel.startsWith('..') && (await tree.isTracked(query.root, rel))
	const working = (await workspace.readFile(query.path)) ?? ''
	if (!tracked)
		return {
			files: [fileEntry(key, working, 'added')],
			changes: [],
			rawDiff: '',
		}
	// A tracked path is never empty (git refuses an empty pathspec), so this is `-- <rel>`.
	const rawDiff = await tree.diff(query.root, { path: rel })
	if (!rawDiff.trim())
		return {
			files: [fileEntry(key, working, 'modified')],
			changes: [],
			rawDiff: '',
		}
	// New side is the working tree - hashed locally (no committed OID); the UI re-diffs old/new (fetched on open against the INDEX baseline via readFileContents), not these hunks.
	const parsedDiff = parseUnifiedDiff(rawDiff)
	const assembled = await assembleDiff(parsedDiff, {
		fetchNew: p => tree.workingFile(query.root, p),
		isStageable: true,
		isWorkingSide: true,
	})
	return { ...assembled, rawDiff }
}

// plus the untracked files git's diff can't see.
async function buildRepoSource(
	query: RepoQuery,
	git: GitPort,
	tree: WorkingTreePort,
): Promise<DiffSource | null> {
	// -M asks git itself to detect renames, so committed/staged renames render deterministically regardless of the user's `diff.renames` config.
	const rawDiff = await tree.diff(query.root, {
		staged: query.staged,
		path: query.path,
	})
	// Parse once here and reuse it for both assembleDiff and the DiffSource result (issue 06).
	const parsedDiff = rawDiff.trim() ? parseUnifiedDiff(rawDiff) : []
	const { files, changes } = await assembleRepoDiff(parsedDiff, query, tree)
	if (!query.staged)
		await appendUntrackedFiles(
			files,
			changes,
			{ root: query.root, path: query.path },
			git,
		)
	if (!files.length) return null
	return { files, changes, rawDiff }
}

// Each side must match what the diff was taken against: the UI re-diffs the old/new contents
// itself instead of rendering these hunks, and unstaged diffs working tree vs INDEX - old reads
// :0, a HEAD baseline would resurrect already-staged changes as pending diff on every reload.
async function assembleRepoDiff(
	parsedDiff: readonly DiffFile[],
	query: RepoQuery,
	tree: WorkingTreePort,
): Promise<AssembledDiff> {
	if (!parsedDiff.length) return { files: [], changes: [] }
	return await assembleDiff(parsedDiff, {
		// Staged: the new side is the index (committed), harvested from `git diff --raw` in one process, so fetchNew is never called; unstaged: the new side is the dirty working tree (reported all-zeros), so fetchNew reads it to hash.
		fetchNew: p =>
			query.staged
				? tree.indexFile(query.root, p)
				: tree.workingFile(query.root, p),
		isStageable: true,
		newOids: query.staged
			? await tree.stagedBlobOids(query.root, query.path)
			: undefined,
		isWorkingSide: !query.staged,
	})
}

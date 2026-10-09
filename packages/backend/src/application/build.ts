import crypto from 'node:crypto'
import path from 'node:path'

import { hash, sanitizeSession } from '../domain/identity.js'

import { buildDiffSource, resolveDefaultBranch } from './diff-source.js'
import { nowIso } from './time.js'

import type { ReviewMode, ReviewState } from '../domain/review.js'
import type { DiffSource } from './diff-source.js'
import type { GitPort } from './ports.js'

export type BuildQuery = {
	mode?: ReviewMode | undefined
	path?: string | undefined
	staged?: boolean | undefined
	session: string
	target?: string | undefined
	base?: string | undefined
	// pr only: the commit to read the branch at instead of HEAD (an open's resolved head, before its checkout).
	head?: string | undefined
}

export async function buildReviewState(
	cwd: string,
	query: BuildQuery,
	git: GitPort,
): Promise<ReviewState | null> {
	const mode = query.mode ?? 'repo'
	if (mode === 'file') return await buildFileReview(cwd, query, git)
	if (mode === 'pr') return await buildPrReview(cwd, query, git)
	return await buildRepoReview(cwd, query, git)
}

// Symlinks resolve (macOS /var → /private/var) so the path agrees with getGitRoot's realpath and relative() does not wrongly escape the repo.
async function buildFileReview(
	cwd: string,
	query: BuildQuery,
	git: GitPort,
): Promise<ReviewState | null> {
	const requested = query.path ?? ''
	const resolved = path.isAbsolute(requested)
		? requested
		: path.resolve(cwd, requested)
	const abs = (await git.workspace.realpath(resolved)) ?? resolved
	const root = await git
		.getGitRoot(path.dirname(abs))
		.catch(() => path.dirname(abs))
	const source = await buildDiffSource({ mode: 'file', root, path: abs }, git)
	if (!source) return null
	const relative = path.relative(root, abs)
	return makeReviewState({
		mode: 'file',
		session: query.session,
		root,
		target: relative.startsWith('..') ? abs : relative,
		staged: false,
		head: await git.getHead(root),
		source,
	})
}

// base defaults to the clone's default branch and then to its merge-base with the reviewed head (HEAD, or the head an open resolved before its checkout), so a feature branch reviews only its own commits.
async function buildPrReview(
	cwd: string,
	query: BuildQuery,
	git: GitPort,
): Promise<ReviewState | null> {
	const root = await git.getGitRoot(cwd)
	const defaultBranch = query.base ?? (await resolveDefaultBranch(root, git))
	const base = await git
		.run(['merge-base', defaultBranch, query.head ?? 'HEAD'], root)
		.catch(() => defaultBranch)
	const source = await buildDiffSource(
		{ mode: 'pr', root, base, head: query.head },
		git,
	)
	if (!source) return null
	return makeReviewState({
		mode: 'pr',
		session: query.session,
		root,
		target: query.target,
		base,
		staged: false,
		head: query.head ?? (await git.getHead(root)),
		source,
	})
}

async function buildRepoReview(
	cwd: string,
	query: BuildQuery,
	git: GitPort,
): Promise<ReviewState | null> {
	const scope = await resolveScope(cwd, query.path, git)
	const source = await buildDiffSource(
		{
			mode: 'repo',
			root: scope.root,
			path: scope.relative,
			staged: query.staged,
		},
		git,
	)
	if (!source) return null
	return makeReviewState({
		mode: 'repo',
		session: query.session,
		root: scope.root,
		staged: !!query.staged,
		head: await git.getHead(scope.root),
		source,
	})
}

async function resolveScope(
	cwd: string,
	diffPath: string | undefined,
	git: GitPort,
): Promise<{ root: string; relative: string | undefined }> {
	if (!diffPath)
		return { root: await git.getGitRoot(cwd), relative: undefined }
	const requested = path.isAbsolute(diffPath)
		? diffPath
		: path.resolve(cwd, diffPath)
	const root = await git.getGitRoot(await discoveryDir(cwd, requested, git))
	return { root, relative: path.relative(root, requested) }
}

// Git is found from the scoped folder (a scoped file's own folder); once that folder is deleted or renamed, from cwd instead, so the scope still diffs - showing the deletion - rather than git failing to start in a folder that is gone.
async function discoveryDir(
	cwd: string,
	requested: string,
	git: GitPort,
): Promise<string> {
	if (await git.workspace.isDirectory(requested)) return requested
	const parent = path.dirname(requested)
	if (await git.workspace.isDirectory(parent)) return parent
	return cwd
}

// A desk with nothing to review yet, over an empty diff: the hub keeps such a desk open (the agent's next reload fills it) instead of refusing it, so a review can be set up before the changes exist.
export async function emptyReviewState(
	cwd: string,
	query: BuildQuery,
	git: GitPort,
): Promise<ReviewState> {
	const root = await git.getGitRoot(cwd).catch(() => cwd)
	return makeReviewState({
		mode: query.mode ?? 'repo',
		session: query.session,
		root,
		target: query.target,
		base: query.base,
		staged: !!query.staged,
		head: await git.getHead(root),
		source: { files: [], changes: [], rawDiff: '' },
	})
}

function makeReviewState(input: {
	mode: ReviewMode
	session: string
	root: string
	staged: boolean
	head: string | null
	source: DiffSource
	target?: string | undefined
	base?: string | undefined
}): ReviewState {
	const { source } = input
	const state: ReviewState = {
		id: crypto.randomUUID(),
		session: sanitizeSession(input.session),
		root: input.root,
		repoHash: hash(input.root),
		mode: input.mode,
		target: input.target,
		base: input.base,
		staged: input.staged,
		head: input.head,
		baseDiffHash: hash(source.rawDiff),
		createdAt: nowIso(),
		updatedAt: nowIso(),
		rawDiff: source.rawDiff,
		files: source.files,
		comments: [],
		changes: source.changes,
		reviewedFiles: [],
		reviewedFileHashes: {},
		stagedFiles: [],
		decisions: [],
	}
	return state
}

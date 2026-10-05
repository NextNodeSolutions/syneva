import path from 'node:path'

import { deskId, deskSession } from '../domain/identity.js'

import { buildReviewState, emptyReviewState } from './build.js'
import { resolvePrTarget } from './pr-target.js'
import { mergeReviewState, readStagedSnapshot } from './reconcile.js'

import type { Guide, ReviewMode, ReviewState } from '../domain/review.js'
import type { BuildQuery } from './build.js'
import type { GitPort, ReviewStorePort } from './ports.js'

// What a caller asks the hub to review: a path inside the repo (any path - the git root is
// resolved here), the mode and its parameters. The root is absolute: the CLI resolves its paths
// against its own cwd before posting, because the hub's cwd is never the agent's. A file
// target may come relative (the dashboard's New review): it is read from the root, as the CLI
// would from there (see fileTarget).
export type DeskQuery = {
	root: string
	mode: ReviewMode
	session?: string | undefined
	target?: string | undefined
	base?: string | undefined
	staged: boolean
	pathFilter?: string | undefined
}

// A desk's resolved identity: the repo root, the session name and the id derived from both,
// plus the PR target/base once resolved (a PR number becomes its head branch here).
export type DeskIdentity = {
	id: string
	root: string
	session: string
	branch: string
	target: string | undefined
	base: string | undefined
}

export type DeskIdentityOutcome =
	| { ok: true; identity: DeskIdentity }
	| { ok: false; reason: string }

// The collaborator ports a desk build drives: git (the diff) and the review store (the saved
// review to merge, the persist).
export type DeskIo = { git: GitPort; store: ReviewStorePort }

export type DeskBuildOutcome =
	| { ok: true; state: ReviewState }
	| { ok: false; reason: string }

// Why the hub cannot open a desk at the query's root, or null when it can: the folder is not on
// the hub's machine, or (outside file mode, which reviews a file wherever it sits) it is in no
// git repository. Checked before git runs there, so a mistyped path answers with a sentence
// instead of a spawn error or git's own stderr.
export async function rootProblem(
	query: DeskQuery,
	git: GitPort,
): Promise<string | null> {
	if (!(await git.workspace.isDirectory(query.root)))
		return `No folder at ${query.root} on the hub's machine.`
	if (query.mode === 'file') return null
	const isRepository = await git.getGitRoot(query.root).then(
		() => true,
		() => false,
	)
	if (isRepository) return null
	return `No git repository at ${query.root} on the hub's machine.`
}

// A file target as the CLI posts it: absolute, a relative one resolved against the path the
// open names (`syneva open file docs/plan.md` run there). The default session is derived from
// it, so the same file opened from the dashboard and from the CLI lands on the same desk.
// Absolute paths are kept as given - realpath'ing them would rename existing desks.
export function fileTarget(query: DeskQuery): string | undefined {
	if (query.mode !== 'file' || !query.target) return query.target
	return path.resolve(query.root, query.target)
}

// Resolve who a query names BEFORE anything is built: the root, the PR target (which may check
// out a branch - the same step the CLI used to run), the session and the id. The hub looks the
// id up first, so a second open of a live desk reloads it instead of building a twin.
export async function resolveDeskIdentity(
	query: DeskQuery,
	git: GitPort,
): Promise<DeskIdentityOutcome> {
	const root = await git.getGitRoot(query.root).catch(() => query.root)
	const branch = (await git.getBranch(root)) || ''
	const pr = await resolvePrTarget(
		{ mode: query.mode, target: fileTarget(query), base: query.base, root },
		git,
	)
	if (!pr.ok) return pr
	const session = deskSession(
		query.mode,
		pr.target.target,
		branch,
		query.session,
	)
	return {
		ok: true,
		identity: {
			id: deskId(root, session),
			root,
			session,
			branch,
			target: pr.target.target,
			base: pr.target.base,
		},
	}
}

// A desk's identity from its saved rebuild parameters (a hub restart): no PR resolution, no
// checkout - the repo is wherever the agent left it, and a restart must never move HEAD.
export async function restoredDeskIdentity(
	record: {
		id: string
		root: string
		session: string
		target?: string | undefined
		base?: string | undefined
	},
	git: GitPort,
): Promise<DeskIdentity> {
	return {
		id: record.id,
		root: record.root,
		session: record.session,
		branch: (await git.getBranch(record.root)) || '',
		target: record.target,
		base: record.base,
	}
}

// Build the review a desk serves: the fresh diff, merged with the review the session saved
// before (decisions, comments and sign-offs survive by content hash), the guide stamped to the
// diff it describes, the staged snapshot folded in (repo mode), then persisted - the stamped
// root is what the desk publishes. A diff with nothing to review still yields a desk (an empty
// one, waiting for the agent's next reload); only a file that cannot be read is an error.
export async function buildDeskState(
	identity: DeskIdentity,
	query: DeskQuery,
	guide: Guide | undefined,
	io: DeskIo,
): Promise<DeskBuildOutcome> {
	const buildQuery = toBuildQuery(identity, query)
	const built = await buildReviewState(identity.root, buildQuery, io.git)
	if (!built && query.mode === 'file')
		return { ok: false, reason: 'File not found or unreadable.' }
	const base =
		built ?? (await emptyReviewState(identity.root, buildQuery, io.git))
	const saved = await io.store.loadLatestReview(base.root, identity.session)
	let state = await mergeReviewState(base, saved, io.git)
	// Stamp the diff the grouping was generated against: once a reload advances past it the desk
	// notes the grouping may be out of date (Guide.baseDiffHash).
	if (guide)
		state = {
			...state,
			guide: { ...guide, baseDiffHash: state.baseDiffHash },
		}
	if (query.mode === 'repo')
		state = { ...state, ...(await readStagedSnapshot(state, io.git)) }
	const persisted = await io.store.persistReview(state)
	return { ok: true, state: { ...state, ...persisted.stamp } }
}

// The build parameters per mode: file reviews its target path, repo narrows to the path
// filter, pr reviews the resolved head (the given target, else the checked-out branch).
function toBuildQuery(identity: DeskIdentity, query: DeskQuery): BuildQuery {
	return {
		mode: query.mode,
		session: identity.session,
		staged: query.staged,
		path: buildPathOf(query),
		target:
			query.mode === 'pr'
				? (identity.target ?? identity.branch)
				: undefined,
		base: query.mode === 'pr' ? identity.base : undefined,
	}
}

function buildPathOf(query: DeskQuery): string | undefined {
	if (query.mode === 'file') return fileTarget(query)
	if (query.mode === 'repo') return query.pathFilter
	return undefined
}

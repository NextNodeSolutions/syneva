import { deskId, deskSession } from '../domain/identity.js'

import { buildReviewState, emptyReviewState } from './build.js'
import { resolvePrTarget } from './pr-target.js'
import { mergeReviewState, readStagedSnapshot } from './reconcile.js'

import type { Guide, ReviewMode, ReviewState } from '../domain/review.js'
import type { BuildQuery } from './build.js'
import type { GitPort, ReviewStorePort } from './ports.js'

// What a caller asks the hub to review: a path inside the repo (any path - the git root is
// resolved here), the mode and its parameters. Paths are absolute: the CLI resolves them
// against its own cwd before posting, because the hub's cwd is never the agent's.
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
		{ mode: query.mode, target: query.target, base: query.base, root },
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
	if (query.mode === 'file') return query.target
	if (query.mode === 'repo') return query.pathFilter
	return undefined
}

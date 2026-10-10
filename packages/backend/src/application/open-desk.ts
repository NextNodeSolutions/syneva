import path from 'node:path'

import { deskId, deskSession } from '../domain/identity.js'

import { attachGuide } from './attach-guide.js'
import { buildReviewState, emptyReviewState } from './build.js'
import { guideExpectation } from './open-policy.js'
import { resolvePrTarget } from './pr-target.js'
import { mergeReviewState, readStagedSnapshot } from './reconcile.js'

import type { Guide } from '../domain/guide-shapes.js'
import type { ReviewMode, ReviewState } from '../domain/review.js'
import type { BuildQuery } from './build.js'
import type { GitPort, ReviewStorePort } from './ports.js'
import type { PrCheckout } from './pr-target.js'

// The CLI resolves its paths against its own cwd before posting, because the hub's cwd is never the agent's; a relative file target reads from the root, as the CLI would from there.
export type DeskQuery = {
	root: string
	mode: ReviewMode
	session?: string | undefined
	target?: string | undefined
	base?: string | undefined
	staged: boolean
	pathFilter?: string | undefined
	// The reviewer wants no guide on this repo or pr desk (otherwise the desk expects one).
	noGuide: boolean
}

// A pr identity also carries the resolved head (the commit its diff is read from before any checkout) and the checkout an admitted open then runs.
export type DeskIdentity = {
	id: string
	root: string
	session: string
	branch: string
	target: string | undefined
	base: string | undefined
	head?: string | undefined
	checkout?: PrCheckout | undefined
}

export type DeskIdentityOutcome =
	| { ok: true; identity: DeskIdentity }
	| { ok: false; reason: string }

export type DeskIo = { git: GitPort; store: ReviewStorePort }

export type DeskBuildOutcome =
	| { ok: true; state: ReviewState }
	| { ok: false; reason: string; code?: 'INVALID_GUIDE' | undefined }

// Checked before git runs there, so a mistyped path answers with a sentence instead of a spawn error or git's own stderr.
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

// The default session is derived from the path, so the same file opened from the dashboard and from the CLI lands on the same desk; absolute paths are kept as given - realpath'ing them would rename existing desks.
export function fileTarget(query: DeskQuery): string | undefined {
	if (query.mode !== 'file' || !query.target) return query.target
	return path.resolve(query.root, query.target)
}

// Resolve BEFORE anything is built: a PR head is fetched and named here, never checked out (that follows an admitted open); the hub looks the id up first, so a second open of a live desk reloads it instead of building a twin.
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
			head: pr.target.head,
			checkout: pr.target.checkout,
		},
	}
}

// From the saved rebuild parameters: no PR resolution, no checkout - the repo is wherever the agent left it, and a restart must never move HEAD.
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

// The review source alone - the diff as an open would build it, with no saved review merged, nothing persisted: what an inventory is taken over and what an open is admitted on. A pr source is read at its resolved head, so it needs no checkout.
export async function buildSourceState(
	identity: DeskIdentity,
	query: DeskQuery,
	git: GitPort,
): Promise<DeskBuildOutcome> {
	const buildQuery = { ...toBuildQuery(identity, query), head: identity.head }
	const built = await buildReviewState(identity.root, buildQuery, git)
	if (!built && query.mode === 'file')
		return { ok: false, reason: 'File not found or unreadable.' }
	return {
		ok: true,
		state:
			built ?? (await emptyReviewState(identity.root, buildQuery, git)),
	}
}

// The fresh diff merges with the saved review (decisions/comments/sign-offs survive by content hash; a carried guide is reconciled), a posted guide is attached against the diff, the staged snapshot folded in, then persisted - the stamped root is what the desk publishes.
// An empty diff still yields a desk (waiting for the next reload); only an unreadable file is an error.
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
	// A posted guide is resolved against this very diff before anything is persisted: a refused guide leaves no desk behind.
	if (guide) {
		const attached = await attachGuide(
			state,
			query.pathFilter,
			guide,
			io.git,
		)
		if (!attached.ok)
			return { ok: false, reason: attached.reason, code: 'INVALID_GUIDE' }
		state = { ...state, ...attached.attachment }
	}
	if (query.mode === 'repo')
		state = { ...state, ...(await readStagedSnapshot(state, io.git)) }
	// The open's own words decide whether the desk waits for a guide; a restore rebuilds from the same words.
	state = { ...state, guideExpected: guideExpectation(query) }
	const persisted = await io.store.persistReview(state)
	return { ok: true, state: { ...state, ...persisted.stamp } }
}

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

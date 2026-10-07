import { validateGuide } from '../domain/guide.js'
import { hash } from '../domain/identity.js'

import { buildReviewState } from './build.js'
import { mergeReviewState, readStagedSnapshot } from './reconcile.js'

import type { Guide, ReviewState } from '../domain/review.js'
import type { GitPort, ReviewStorePort } from './ports.js'

export type ReloadIo = { git: GitPort; store: ReviewStorePort }

export type ReloadOutcome =
	| { kind: 'reloaded'; state: ReviewState; baseDiffHash: string }
	| { kind: 'empty'; state: ReviewState; baseDiffHash: string }
	| { kind: 'invalid-guide'; reason: string }

// Nothing is committed to the live state until every guide validation has passed; the caller commits the returned root (copy-on-write - the live root is never edited in place).
// `pathFilter` is the desk's repo-mode `--path` limit: the review state does not carry it, so the caller passes the one the desk was opened with.
export async function reloadDesk(
	state: ReviewState,
	pathFilter: string | undefined,
	io: ReloadIo,
	guideSwap: { guide: unknown } | undefined,
): Promise<ReloadOutcome> {
	let validatedGuide: Guide | undefined
	if (guideSwap) {
		const validation = validateGuide(guideSwap.guide)
		if (!validation.ok)
			return { kind: 'invalid-guide', reason: validation.reason }
		validatedGuide = validation.guide
	}
	const base = await rebuildBase(state, pathFilter, io.git)
	if (!base) return await reloadEmpty(state, io)
	let merged = await mergeReviewState(base, state, io.git)
	// A posted guide replaces the carried one, stamped with the diff it describes as of now so it is not born stale; a reload without one leaves the carried guide alone.
	if (validatedGuide)
		merged = {
			...merged,
			guide: { ...validatedGuide, baseDiffHash: merged.baseDiffHash },
		}
	const snapshot = await readStagedSnapshot(merged, io.git)
	const persisted = await io.store.persistReview({ ...merged, ...snapshot })
	return {
		kind: 'reloaded',
		state: { ...merged, ...snapshot, ...persisted.stamp },
		baseDiffHash: merged.baseDiffHash,
	}
}

async function rebuildBase(
	state: ReviewState,
	pathFilter: string | undefined,
	git: GitPort,
): Promise<ReviewState | null> {
	return await buildReviewState(
		state.root,
		{
			mode: state.mode,
			session: state.session,
			staged: state.staged,
			path: rebuildPathOf(state, pathFilter),
			target: state.mode === 'pr' ? state.target : undefined,
			base: state.mode === 'pr' ? state.base : undefined,
		},
		git,
	)
}

// The path rule an open builds with (open-desk.ts buildPathOf): a file desk's own file, a repo desk's `--path` limit.
function rebuildPathOf(
	state: ReviewState,
	pathFilter: string | undefined,
): string | undefined {
	if (state.mode === 'file') return state.target
	if (state.mode === 'repo') return pathFilter
	return undefined
}

// Keeps the desk up with an empty diff; deliberately does NOT run mergeReviewState/readStagedSnapshot reconciliation - that divergence predates this cleanup and is preserved here.
async function reloadEmpty(
	state: ReviewState,
	io: ReloadIo,
): Promise<ReloadOutcome> {
	const emptied: ReviewState = {
		...state,
		files: [],
		changes: [],
		rawDiff: '',
		baseDiffHash: hash(''),
	}
	const persisted = await io.store.persistReview(emptied)
	return {
		kind: 'empty',
		state: { ...emptied, ...persisted.stamp },
		baseDiffHash: emptied.baseDiffHash,
	}
}

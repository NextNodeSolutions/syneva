import { reanchorDomainComments } from '../domain/domain-comments.js'
import { reconcileGuide } from '../domain/guide-reconcile.js'
import { validateGuide } from '../domain/guide.js'
import { hash } from '../domain/identity.js'
import { buildInventory } from '../domain/inventory.js'

import { attachGuide } from './attach-guide.js'
import { buildReviewState } from './build.js'
import { mergeReviewState, readStagedSnapshot } from './reconcile.js'

import type { Guide } from '../domain/guide-shapes.js'
import type { ReviewState } from '../domain/review.js'
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
	if (!base) return await reloadEmpty(state, pathFilter, validatedGuide, io)
	const merged = await withPostedGuide(
		await mergeReviewState(base, state, io.git),
		pathFilter,
		validatedGuide,
		io.git,
	)
	if (!merged.ok) return { kind: 'invalid-guide', reason: merged.reason }
	const snapshot = await readStagedSnapshot(merged.state, io.git)
	const persisted = await io.store.persistReview({
		...merged.state,
		...snapshot,
	})
	return {
		kind: 'reloaded',
		state: { ...merged.state, ...snapshot, ...persisted.stamp },
		baseDiffHash: merged.state.baseDiffHash,
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

type GuidedState =
	| { ok: true; state: ReviewState }
	| { ok: false; reason: string }

// A posted guide replaces the carried one only once it resolves against the rebuilt diff (same source, full coverage, every reference landing); a refused one leaves the live desk, its guide and its verdicts as they were. A reload without one keeps the carried guide, reconciled by the merge.
async function withPostedGuide(
	state: ReviewState,
	pathFilter: string | undefined,
	guide: Guide | undefined,
	git: GitPort,
): Promise<GuidedState> {
	if (!guide) return { ok: true, state }
	const attached = await attachGuide(state, pathFilter, guide, git)
	if (!attached.ok) return attached
	return {
		ok: true,
		state: {
			...state,
			...attached.attachment,
			domainComments: reanchorDomainComments(
				state.domainComments ?? [],
				attached.attachment.guide,
			),
		},
	}
}

// Keeps the desk up with an empty diff; deliberately does NOT run mergeReviewState/readStagedSnapshot reconciliation - that divergence predates this cleanup and is preserved here.
// A guide posted with this reload must be the empty guide (no domains); a carried one is reconciled against the empty inventory, so every domain reads stale rather than current.
async function reloadEmpty(
	state: ReviewState,
	pathFilter: string | undefined,
	guide: Guide | undefined,
	io: ReloadIo,
): Promise<ReloadOutcome> {
	const cleared: ReviewState = {
		...state,
		files: [],
		changes: [],
		rawDiff: '',
		baseDiffHash: hash(''),
	}
	const emptied = await withPostedGuide(
		{ ...cleared, guideResolution: reconciledOnEmpty(cleared) },
		pathFilter,
		guide,
		io.git,
	)
	if (!emptied.ok) return { kind: 'invalid-guide', reason: emptied.reason }
	const persisted = await io.store.persistReview(emptied.state)
	return {
		kind: 'empty',
		state: { ...emptied.state, ...persisted.stamp },
		baseDiffHash: emptied.state.baseDiffHash,
	}
}

function reconciledOnEmpty(
	cleared: ReviewState,
): ReviewState['guideResolution'] {
	if (!cleared.guide || !cleared.guideResolution) return undefined
	return reconcileGuide(
		cleared.guide,
		cleared.guideResolution,
		buildInventory(cleared, undefined),
		new Map(),
	)
}

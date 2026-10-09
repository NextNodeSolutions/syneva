import { sourceFingerprint } from '../domain/inventory.js'

import { attachGuide } from './attach-guide.js'
import { buildSourceState } from './open-desk.js'

import type { Guide } from '../domain/guide-shapes.js'
import type { ReviewState } from '../domain/review.js'
import type { DeskIdentity, DeskIo, DeskQuery } from './open-desk.js'

export type AdmissionCode = 'GUIDE_REQUIRED' | 'INVALID_GUIDE' | 'NO_REVIEW'

export type Admission =
	| { ok: true }
	| { ok: false; code: AdmissionCode; reason: string }

const DESK_NAMES = { repo: 'repository', pr: 'PR', file: 'file' } as const

// The open policy: a repo or pr desk is born guided - an open of one brings a guide, or the session's saved guide still describes this very source; a file desk needs none, and neither does an empty changeset (nothing to explain).
// It is judged on the source as the desk will review it, before a desk is replaced, a review persisted or a branch checked out, so a refused open leaves everything as it was. A restore is not an open and never passes here.
export async function admitOpen(
	identity: DeskIdentity,
	query: DeskQuery,
	guide: Guide | undefined,
	io: DeskIo,
): Promise<Admission> {
	if (query.mode === 'file' && !guide) return { ok: true }
	const source = await buildSourceState(identity, query, io.git)
	if (!source.ok)
		return { ok: false, code: 'NO_REVIEW', reason: source.reason }
	if (guide)
		return await admitGuide(source.state, query.pathFilter, guide, io)
	if (query.mode === 'file' || !source.state.files.length) return { ok: true }
	return await admitSavedGuide(source.state, identity, query, io)
}

// A live desk reopened without a guide reloads with the one it carries (marked stale where the code moved on); one that never had a guide cannot become guided by a reload, and stays as it is.
export function admitReopen(
	state: ReviewState,
	guide: Guide | undefined,
): Admission {
	if (guide || state.mode === 'file' || state.guide || !state.files.length)
		return { ok: true }
	return {
		ok: false,
		code: 'GUIDE_REQUIRED',
		reason: `This live ${DESK_NAMES[state.mode]} desk has no review guide and none was given, so it stays as it is. Reopen it with a guide (syneva open … --guide <file>); syneva reload needs none.`,
	}
}

async function admitGuide(
	state: ReviewState,
	pathFilter: string | undefined,
	guide: Guide,
	io: DeskIo,
): Promise<Admission> {
	const attached = await attachGuide(state, pathFilter, guide, io.git)
	if (attached.ok) return { ok: true }
	return { ok: false, code: 'INVALID_GUIDE', reason: attached.reason }
}

// A guide saved for the session counts when its fingerprint is the source's: the same changed code, so its ownership and references hold. Code changed since means a new review: a fresh guide, not the old explanations read against it.
async function admitSavedGuide(
	state: ReviewState,
	identity: DeskIdentity,
	query: DeskQuery,
	io: DeskIo,
): Promise<Admission> {
	const saved = await io.store.loadLatestReview(state.root, identity.session)
	const current = sourceFingerprint(state, query.pathFilter)
	if (saved?.guide?.source.fingerprint === current) return { ok: true }
	const why = saved?.guide
		? 'the guide saved for this session describes an earlier version of the code'
		: 'none was given'
	return {
		ok: false,
		code: 'GUIDE_REQUIRED',
		reason: `A ${DESK_NAMES[query.mode]} desk opens with a review guide, and ${why}. Ask your agent to open it with one (syneva open … --guide <file>), or review a single file instead.`,
	}
}

import { reviewScope } from '../application/desk-summary.js'
import { errorMessage } from '../application/errors.js'
import { deskClosed } from '../application/journal.js'
import { createSerializer } from '../application/mutex.js'
import {
	buildDeskState,
	resolveDeskIdentity,
	rootProblem,
	restoredDeskIdentity,
} from '../application/open-desk.js'
import { admitOpen, reopenedState } from '../application/open-policy.js'
import { checkoutPrTarget } from '../application/pr-target.js'
import { reloadDesk } from '../application/reload-desk.js'
import { nowIso, nowMs } from '../application/time.js'

import { hostDesk, summarize } from './hosted-desk.js'
import {
	keepOpenPreferences,
	liveDesk,
	liveDesks,
	liveRecords,
	pruneClosed,
} from './hub-desks.js'
import { inventoryOf } from './hub-inventory.js'
import { queryOf, recordOf, sameSource } from './hub-records.js'

import type { DeskSummary, OpenDeskOutcome } from '@syneva/contracts/hub'
import type { DeskIdentity, DeskQuery } from '../application/open-desk.js'
import type { HubRegistryPort } from '../application/ports.js'
import type { AuthoredGuide } from '../domain/guide-shapes.js'
import type { HubDeskRecord } from '../domain/hub-registry.js'
import type { ReviewInventory } from '../domain/inventory.js'
import type { ReviewState } from '../domain/review.js'
import type { HostedDeskIo, HubDesk } from './hosted-desk.js'

export type HubFailure = { ok: false; code: string; reason: string }

export type OpenOutcome =
	| { ok: true; desk: HubDesk; outcome: OpenDeskOutcome }
	| HubFailure

export type InventoryOutcome =
	| { ok: true; inventory: ReviewInventory }
	| HubFailure

export type HubIo = HostedDeskIo & {
	registry: HubRegistryPort
	log: (line: string) => void
}

// The one place a desk is born, reused, restored or closed; opens are serialized so two agents racing to open the same repo+session get one desk (the second sees the first's and reloads it).
type PostedGuide = AuthoredGuide | undefined

export type Hub = {
	readonly instanceId: string
	readonly startedAt: string
	openDesk(query: DeskQuery, guide: PostedGuide): Promise<OpenOutcome>
	// The review source as a guide is authored against it, built from the repo as it stands now without registering, persisting or journaling anything.
	inventory(query: DeskQuery): Promise<InventoryOutcome>
	getDesk(id: string): HubDesk | undefined
	listDesks(): HubDesk[]
	// Emit `closed` to the desk's parked waiter and write the registry without it; its entry goes once the grace is past (hub-desks.ts). False when there is no such live desk (already closed is not an error - close is idempotent).
	closeDesk(id: string): boolean
	// A hub restart reopens every desk the registry recorded; desks whose repo is gone or whose diff no longer builds are dropped, with the reason logged.
	restore(): Promise<void>
	// Settles once the restore under way has, whatever its outcome: the hub listens before it restores, and a request that names a desk waits for this rather than reading a desk still being rebuilt as closed.
	restored(): Promise<void>
	summary(desk: HubDesk): DeskSummary
	persist(): Promise<void>
}

export type HubState = {
	desks: Map<string, HubDesk>
	io: HubIo
	persist: () => Promise<void>
}

export function createHub(io: HubIo, instanceId: string): Hub {
	const desks = new Map<string, HubDesk>()
	const serializeOpen = createSerializer()
	const serializeWrite = createSerializer()
	const state: HubState = {
		desks,
		io,
		persist: () =>
			serializeWrite(() =>
				io.registry.save(liveRecords(pruneClosed(desks, nowMs()))),
			),
	}
	let restoring: Promise<void> = Promise.resolve()
	return {
		instanceId,
		startedAt: nowIso(),
		openDesk: (query, guide) =>
			serializeOpen(() => openOrReuse(state, query, guide)),
		inventory: query => serializeOpen(() => inventoryOf(state, query)),
		getDesk: id => liveDesk(pruneClosed(desks, nowMs()), id),
		listDesks: () => liveDesks(pruneClosed(desks, nowMs())),
		closeDesk: id => closeDesk(state, id),
		restore(): Promise<void> {
			restoring = restoreAll(state)
			return restoring
		},
		async restored(): Promise<void> {
			await Promise.allSettled([restoring])
		},
		summary: summarize,
		persist: state.persist,
	}
}

async function restoreAll(state: HubState): Promise<void> {
	const records = await state.io.registry.load()
	// Independent repos rebuild concurrently; a failed one only drops itself.
	await Promise.all(records.map(record => restoreOne(state, record)))
	await state.persist()
}

// The registry is written at once, without the desk: a hub stopped right after a close must not restore it.
function closeDesk(state: HubState, id: string): boolean {
	if (!markClosed(state, id)) return false
	void state.persist()
	return true
}

function markClosed(state: HubState, id: string): boolean {
	const desk = liveDesk(state.desks, id)
	if (!desk) return false
	desk.ctx.recordEvent(deskClosed(summarize(desk), desk.record))
	desk.closedAt = nowMs()
	desk.ctx.events.emit({ kind: 'closed', session: desk.record.session })
	state.io.log(
		`desk closed ${id} (${desk.record.root} · ${desk.record.session})`,
	)
	return true
}

function registerDesk(
	state: HubState,
	review: ReviewState,
	record: HubDeskRecord,
): HubDesk {
	const desk = hostDesk(state.io, review, record, () => {
		closeDesk(state, record.id)
	})
	state.desks.set(record.id, desk)
	return desk
}

// Refuse a root the hub cannot open (a sentence, not git's error), resolve who the query names,
// then reuse the live desk for that id or build a new one; a desk reviewing a different source
// under the same id is replaced - its tab refreshes onto the new one.
// A new desk is admitted (the open policy) on the source as it will be reviewed, before the desk it replaces is closed and before a PR head is checked out: a refusal leaves the live desk, the review file and HEAD untouched.
async function openOrReuse(
	state: HubState,
	query: DeskQuery,
	guide: PostedGuide,
): Promise<OpenOutcome> {
	const problem = await rootProblem(query, state.io.git)
	if (problem) return { ok: false, code: 'NO_REPOSITORY', reason: problem }
	const resolved = await resolveDeskIdentity(query, state.io.git)
	if (!resolved.ok)
		return { ok: false, code: 'PR_TARGET', reason: resolved.reason }
	const { identity } = resolved
	const live = liveDesk(state.desks, identity.id)
	const open = { identity, query, guide }
	if (live && sameSource(live.record, query, identity))
		return reuseDesk(state, live, open)
	const admission = await admitOpen(identity, query, guide, state.io)
	if (!admission.ok) return admission
	return createDesk(state, open, live)
}

// An open once its identity is resolved: what reuse and creation both act on.
type ResolvedOpen = {
	identity: DeskIdentity
	query: DeskQuery
	guide: PostedGuide
}

// A reopen is a reload that may also change what the desk expects of its guide (--no-guide, or back to the default). A pr reopen checks its head out again first (the agent may have switched branches since), once a posted guide is admitted, so a refusal still leaves HEAD where it was.
async function reuseDesk(
	state: HubState,
	live: HubDesk,
	{ identity, query, guide }: ResolvedOpen,
): Promise<OpenOutcome> {
	if (identity.checkout) {
		const admission = await admitOpen(identity, query, guide, state.io)
		if (!admission.ok) return admission
		const checkout = await checkoutPrTarget(
			identity.checkout,
			identity.root,
			state.io.git,
		)
		if (!checkout.ok)
			return { ok: false, code: 'PR_TARGET', reason: checkout.reason }
	}
	const outcome = await live.ctx.serialize(() =>
		reloadDesk(
			reopenedState(live.ctx.state, query),
			live.ctx.pathFilter,
			{ git: state.io.git, store: state.io.store },
			guide ? { guide } : undefined,
		),
	)
	if (outcome.kind === 'invalid-guide')
		return { ok: false, code: 'INVALID_GUIDE', reason: outcome.reason }
	live.ctx.commit(outcome.state)
	// The record first (in memory), the registry write after the event: a failed write never
	// leaves a reloaded desk unrecorded.
	const isRecordChanged = keepOpenPreferences(state.desks, live.id, query)
	live.ctx.recordEvent({
		kind: 'desk-reloaded',
		...reviewScope(outcome.state),
	})
	state.io.log(`desk reloaded ${live.id} (${live.record.root})`)
	if (isRecordChanged) await state.persist()
	return { ok: true, desk: live, outcome: 'reloaded' }
}

// The checkout a pr open ends with happens here, once admitted; the desk then builds at the admitted head. The desk it replaces stays live until the new one is built, so a failed checkout or build leaves it reviewable.
async function createDesk(
	state: HubState,
	{ identity, query, guide }: ResolvedOpen,
	replaced: HubDesk | undefined,
): Promise<OpenOutcome> {
	const checkout = await checkoutPrTarget(
		identity.checkout,
		identity.root,
		state.io.git,
	)
	if (!checkout.ok)
		return { ok: false, code: 'PR_TARGET', reason: checkout.reason }
	const built = await buildDeskState(
		identity,
		query,
		{ posted: guide, isOpen: true },
		state.io,
	)
	if (!built.ok)
		return {
			ok: false,
			code: built.code ?? 'NO_REVIEW',
			reason: built.reason,
		}
	// The replaced desk's entry goes at once, and the registry is written once, with the new desk.
	if (replaced) {
		markClosed(state, identity.id)
		state.desks.delete(identity.id)
	}
	const desk = registerDesk(state, built.state, recordOf(identity, query))
	desk.ctx.recordEvent({ kind: 'desk-opened', ...reviewScope(built.state) })
	state.io.log(
		`desk opened ${desk.id} ${identity.root} (${identity.session}, ${query.mode})`,
	)
	await state.persist()
	return { ok: true, desk, outcome: 'created' }
}

async function restoreOne(
	state: HubState,
	record: HubDeskRecord,
): Promise<void> {
	if (state.desks.has(record.id)) return
	try {
		const identity = await restoredDeskIdentity(record, state.io.git)
		const built = await buildDeskState(
			identity,
			queryOf(record),
			{ posted: undefined, isOpen: false },
			state.io,
		)
		if (!built.ok) {
			state.io.log(`desk dropped ${record.id}: ${built.reason}`)
			return
		}
		registerDesk(state, built.state, record)
		state.io.log(
			`desk restored ${record.id} ${record.root} (${record.session})`,
		)
	} catch (error) {
		state.io.log(`desk dropped ${record.id}: ${errorMessage(error)}`)
	}
}

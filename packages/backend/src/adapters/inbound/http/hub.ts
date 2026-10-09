import { reviewScope } from '../../../application/desk-summary.js'
import { errorMessage } from '../../../application/errors.js'
import { deskClosed } from '../../../application/journal.js'
import { createSerializer } from '../../../application/mutex.js'
import {
	buildDeskState,
	resolveDeskIdentity,
	rootProblem,
	restoredDeskIdentity,
} from '../../../application/open-desk.js'
import { reloadDesk } from '../../../application/reload-desk.js'
import { nowIso } from '../../../application/time.js'

import { hostDesk, summarize } from './hosted-desk.js'
import { queryOf, recordOf, sameSource } from './hub-records.js'

import type { DeskSummary, OpenDeskOutcome } from '@syneva/contracts/hub'
import type { DeskIdentity, DeskQuery } from '../../../application/open-desk.js'
import type { HubRegistryPort } from '../../../application/ports.js'
import type { HubDeskRecord } from '../../../domain/hub-registry.js'
import type { Guide, ReviewState } from '../../../domain/review.js'
import type { HostedDeskIo, HubDesk } from './hosted-desk.js'

// The linger lets the `closed` event reach a parked waiter: its HTTP response flushes on the emission, but Node needs a beat to write it to the socket before the desk's routes answer 404.
const CLOSED_EVENT_GRACE_MS = 150

export type HubFailure = { ok: false; code: string; reason: string }

export type OpenOutcome =
	| { ok: true; desk: HubDesk; outcome: OpenDeskOutcome }
	| HubFailure

export type HubIo = HostedDeskIo & {
	registry: HubRegistryPort
	log: (line: string) => void
}

// The one place a desk is born, reused, restored or closed; opens are serialized so two agents racing to open the same repo+session get one desk (the second sees the first's and reloads it).
export type Hub = {
	readonly instanceId: string
	readonly startedAt: string
	openDesk(query: DeskQuery, guide: Guide | undefined): Promise<OpenOutcome>
	getDesk(id: string): HubDesk | undefined
	listDesks(): HubDesk[]
	// Emit `closed` to the desk's parked waiter, then drop it after the grace; false when there is no such live desk (already closed is not an error - close is idempotent).
	closeDesk(id: string): boolean
	// A hub restart reopens every desk the registry recorded; desks whose repo is gone or whose diff no longer builds are dropped, with the reason logged.
	restore(): Promise<void>
	// Settles once the restore under way has, whatever its outcome: the hub listens before it restores, and a request that names a desk waits for this rather than reading a desk still being rebuilt as closed.
	restored(): Promise<void>
	summary(desk: HubDesk): DeskSummary
	persist(): Promise<void>
}

type HubState = {
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
			serializeWrite(() => io.registry.save(liveRecords(desks))),
	}
	let restoring: Promise<void> = Promise.resolve()
	return {
		instanceId,
		startedAt: nowIso(),
		openDesk: (query, guide) =>
			serializeOpen(() => openOrReuse(state, query, guide)),
		getDesk: id => liveDesk(desks, id),
		listDesks: () => [...desks.values()].filter(desk => !desk.closing),
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

function liveDesk(
	desks: Map<string, HubDesk>,
	id: string,
): HubDesk | undefined {
	const desk = desks.get(id)
	if (!desk || desk.closing) return undefined
	return desk
}

function liveRecords(desks: Map<string, HubDesk>): HubDeskRecord[] {
	return [...desks.values()]
		.filter(desk => !desk.closing)
		.map(desk => desk.record)
}

function closeDesk(state: HubState, id: string): boolean {
	const desk = state.desks.get(id)
	if (!desk || desk.closing) return false
	desk.ctx.recordEvent(deskClosed(summarize(desk), desk.record))
	desk.closing = true
	desk.ctx.events.emit({ kind: 'closed', session: desk.record.session })
	state.io.log(
		`desk closed ${id} (${desk.record.root} · ${desk.record.session})`,
	)
	setTimeout(() => {
		if (state.desks.get(id) === desk) state.desks.delete(id)
		void state.persist()
	}, CLOSED_EVENT_GRACE_MS)
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
async function openOrReuse(
	state: HubState,
	query: DeskQuery,
	guide: Guide | undefined,
): Promise<OpenOutcome> {
	const problem = await rootProblem(query, state.io.git)
	if (problem) return { ok: false, code: 'NO_REPOSITORY', reason: problem }
	const resolved = await resolveDeskIdentity(query, state.io.git)
	if (!resolved.ok)
		return { ok: false, code: 'PR_TARGET', reason: resolved.reason }
	const { identity } = resolved
	const live = liveDesk(state.desks, identity.id)
	if (live && sameSource(live.record, query, identity))
		return reuseDesk(state, live, guide)
	if (live) {
		closeDesk(state, identity.id)
		state.desks.delete(identity.id)
	}
	return createDesk(state, identity, query, guide)
}

async function reuseDesk(
	state: HubState,
	live: HubDesk,
	guide: Guide | undefined,
): Promise<OpenOutcome> {
	const guideSwap = guide ? { guide } : undefined
	const outcome = await live.ctx.serialize(() =>
		reloadDesk(
			live.ctx.state,
			live.ctx.pathFilter,
			{ git: state.io.git, store: state.io.store },
			guideSwap,
		),
	)
	if (outcome.kind === 'invalid-guide')
		return { ok: false, code: 'INVALID_GUIDE', reason: outcome.reason }
	live.ctx.commit(outcome.state)
	live.ctx.recordEvent({
		kind: 'desk-reloaded',
		...reviewScope(outcome.state),
	})
	state.io.log(`desk reloaded ${live.id} (${live.record.root})`)
	return { ok: true, desk: live, outcome: 'reloaded' }
}

async function createDesk(
	state: HubState,
	identity: DeskIdentity,
	query: DeskQuery,
	guide: Guide | undefined,
): Promise<OpenOutcome> {
	const built = await buildDeskState(identity, query, guide, state.io)
	if (!built.ok) return { ok: false, code: 'NO_REVIEW', reason: built.reason }
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
			undefined,
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

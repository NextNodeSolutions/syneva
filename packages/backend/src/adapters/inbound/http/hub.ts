import { createActivity } from '../../../application/activity.js'
import { deskSummary } from '../../../application/desk-summary.js'
import { errorMessage } from '../../../application/errors.js'
import { createEventStream } from '../../../application/events.js'
import { createSerializer } from '../../../application/mutex.js'
import {
	buildDeskState,
	resolveDeskIdentity,
	restoredDeskIdentity,
} from '../../../application/open-desk.js'
import { reloadDesk } from '../../../application/reload-desk.js'
import { nowIso } from '../../../application/time.js'

import { createDeskContext } from './context.js'
import { queryOf, recordOf, sameSource } from './hub-records.js'
import { createDeskLiveness } from './liveness.js'

import type { DeskSummary, OpenDeskOutcome } from '@syneva/contracts/hub'
import type { DeskIdentity, DeskQuery } from '../../../application/open-desk.js'
import type {
	EditorPort,
	GitPort,
	HubRegistryPort,
	ReviewStorePort,
	SettingsPort,
} from '../../../application/ports.js'
import type { HubDeskRecord } from '../../../domain/hub-registry.js'
import type { Guide, ReviewState } from '../../../domain/review.js'
import type { DeskContext } from './context.js'
import type { DeskLiveness } from './liveness.js'

// How long a closed desk lingers after its `closed` event so the event reaches a parked waiter
// (its HTTP response flushes on the emission, but Node needs a beat to write it to the socket
// before the desk's routes answer 404). Loopback: a fraction of a second is generous.
const CLOSED_EVENT_GRACE_MS = 150

// One hosted desk: its id, the context its routes run against, and the rebuild parameters the
// registry persists so a restarted hub reopens it on the same id.
export type HubDesk = {
	readonly id: string
	readonly ctx: DeskContext
	readonly liveness: DeskLiveness
	readonly record: HubDeskRecord
	closing: boolean
}

export type HubFailure = { ok: false; code: string; reason: string }

export type OpenOutcome =
	| { ok: true; desk: HubDesk; outcome: OpenDeskOutcome }
	| HubFailure

export type HubIo = {
	git: GitPort
	store: ReviewStorePort
	settings: SettingsPort
	editor: EditorPort
	registry: HubRegistryPort
	statusTtlMs: number
	log: (line: string) => void
}

// The hub: the registry of live desks and the one place a desk is born, reused, restored or
// closed. Opens are serialized so two agents racing to open the same repo+session get one desk
// (the second sees the first's and reloads it); everything else reads the map.
export type Hub = {
	readonly instanceId: string
	readonly startedAt: string
	openDesk(query: DeskQuery, guide: Guide | undefined): Promise<OpenOutcome>
	getDesk(id: string): HubDesk | undefined
	listDesks(): HubDesk[]
	// Emit `closed` to the desk's parked waiter, then drop it after the grace. False when there
	// is no such live desk (already closed is not an error - close is idempotent).
	closeDesk(id: string): boolean
	// Reopen every desk the registry recorded (a hub restart). Desks whose repo is gone or whose
	// diff no longer builds are dropped from the registry, with the reason logged.
	restore(): Promise<void>
	summary(desk: HubDesk): DeskSummary
	// Write the registry now (also done on every open/close) - the shutdown path's last word.
	persist(): Promise<void>
}

// The hub's mutable heart, shared by the operations below: the live desks, the ports, and the
// serialized registry write.
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
	return {
		instanceId,
		startedAt: nowIso(),
		openDesk: (query, guide) =>
			serializeOpen(() => openOrReuse(state, query, guide)),
		getDesk: id => liveDesk(desks, id),
		listDesks: () => [...desks.values()].filter(desk => !desk.closing),
		closeDesk: id => closeDesk(state, id),
		async restore(): Promise<void> {
			const records = await io.registry.load()
			// Independent repos rebuild concurrently; a failed one only drops itself.
			await Promise.all(records.map(record => restoreOne(state, record)))
			await state.persist()
		},
		summary: summarize,
		persist: state.persist,
	}
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

function summarize(desk: HubDesk): DeskSummary {
	return deskSummary(desk.id, desk.ctx.state, desk.ctx.status(), {
		openedAt: desk.liveness.openedAt,
		lastActivityAt: desk.liveness.lastActivityAt(),
	})
}

function closeDesk(state: HubState, id: string): boolean {
	const desk = state.desks.get(id)
	if (!desk || desk.closing) return false
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
	const { io } = state
	const liveness = createDeskLiveness(record.openedAt)
	const desk: HubDesk = {
		id: record.id,
		liveness,
		record,
		closing: false,
		ctx: createDeskContext(review, {
			events: createEventStream(),
			activity: createActivity(io.statusTtlMs),
			liveness,
			git: io.git,
			store: io.store,
			settings: io.settings,
			editor: io.editor,
			close: () => {
				closeDesk(state, record.id)
			},
		}),
	}
	state.desks.set(record.id, desk)
	return desk
}

// Resolve who the query names, then reuse the live desk for that id or build a new one. A
// desk reviewing a different source under the same id (working vs staged, another path
// filter) is replaced instead - its tab refreshes onto the new one.
async function openOrReuse(
	state: HubState,
	query: DeskQuery,
	guide: Guide | undefined,
): Promise<OpenOutcome> {
	const resolved = await resolveDeskIdentity(query, state.io.git)
	if (!resolved.ok)
		return { ok: false, code: 'PR_TARGET', reason: resolved.reason }
	const { identity } = resolved
	const live = liveDesk(state.desks, identity.id)
	if (live && sameSource(live.record, query))
		return reuseDesk(state, live, guide)
	if (live) {
		closeDesk(state, identity.id)
		state.desks.delete(identity.id)
	}
	return createDesk(state, identity, query, guide)
}

// Reuse a live desk for the same repo+session: rebuild its diff (and swap the guide) into
// the open tab.
async function reuseDesk(
	state: HubState,
	live: HubDesk,
	guide: Guide | undefined,
): Promise<OpenOutcome> {
	const guideSwap = guide ? { guide } : undefined
	const outcome = await live.ctx.serialize(() =>
		reloadDesk(
			live.ctx.state,
			{ git: state.io.git, store: state.io.store },
			guideSwap,
		),
	)
	if (outcome.kind === 'invalid-guide')
		return { ok: false, code: 'INVALID_GUIDE', reason: outcome.reason }
	live.ctx.commit(outcome.state)
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

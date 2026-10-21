import { reviewScope } from '../application/desk-summary.js'
import { errorMessage } from '../application/errors.js'
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

import { summarize } from './hosted-desk.js'
import {
	keepOpenPreferences,
	liveDesk,
	liveDesks,
	liveRecords,
	pruneClosed,
} from './hub-desks.js'
import { inventoryOf } from './hub-inventory.js'
import { closeDesk, markClosed, registerDesk } from './hub-membership.js'
import { queryOf, recordOf, sameSource } from './hub-records.js'
import { createHubSignals } from './hub-signals.js'

import type { DeskSummary, OpenDeskOutcome } from '@syneva/contracts/hub'
import type { DeskIdentity, DeskQuery } from '../application/open-desk.js'
import type { HubRegistryPort, PullRequestPort } from '../application/ports.js'
import type { AuthoredGuide } from '../domain/guide-shapes.js'
import type { HubDeskRecord } from '../domain/hub-registry.js'
import type { ReviewInventory } from '../domain/inventory.js'
import type { HostedDeskIo, HubDesk } from './hosted-desk.js'
import type { HubSignal, HubSignals } from './hub-signals.js'

export type HubFailure = { ok: false; code: string; reason: string }

export type OpenOutcome =
	| { ok: true; desk: HubDesk; outcome: OpenDeskOutcome }
	| HubFailure

export type InventoryOutcome =
	| { ok: true; inventory: ReviewInventory }
	| HubFailure

// `pulls` resolves and checks out a pr desk's PR number or URL; a hub without it opens pr desks on branches only.
export type HubIo = HostedDeskIo & {
	registry: HubRegistryPort
	pulls?: PullRequestPort | undefined
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
	// Hear what moves on the hub as it moves (hub-signals.ts): desks joining, moving and leaving,
	// journal events and plan records once on disk, the live desk count. Hands back the
	// unsubscribe. A listener that throws never fails the mutation it heard.
	subscribe(listener: (signal: HubSignal) => void): () => void
}

export type HubState = {
	desks: Map<string, HubDesk>
	io: HubIo
	persist: () => Promise<void>
	signals: HubSignals
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
		signals: createHubSignals(io),
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
		subscribe: state.signals.subscribe,
	}
}

async function restoreAll(state: HubState): Promise<void> {
	const records = await state.io.registry.load()
	// Independent repos rebuild concurrently; a failed one only drops itself.
	await Promise.all(records.map(record => restoreOne(state, record)))
	await state.persist()
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
	const resolved = await resolveDeskIdentity(query, state.io)
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
			state.io,
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
	// The record names the desk's plan, which its summary carries.
	if (isRecordChanged) state.signals.moved(live, 'summary')
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
		state.io,
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

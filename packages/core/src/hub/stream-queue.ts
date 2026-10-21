// One stream's queue between the hub's signals and its socket: what moved is noted when it
// moves and projected when it is sent, so a burst of changes to one desk sends its latest state
// once. Timer-free (core keeps none): `dueAt` says when frames wait, the transport's own timer
// calls `take` then.
import { BRIDGE_LIMITS } from '@syneva/contracts/bridge'

import {
	closedText,
	deskText,
	helloText,
	journalTexts,
	pairingText,
	planTexts,
	pulseText,
	snapshotEndText,
} from './stream-frames.js'

import type { HubEvent } from '@syneva/contracts/hub'
import type { PlanRecord } from '../domain/plan.js'
import type { HubDesk } from './hosted-desk.js'
import type { HubSignal } from './hub-signals.js'
import type { StreamSource } from './stream-frames.js'

// What a stream hears: the hub's signals, and on the local stream its pairing moving (the
// pairing is read when it is sent, as a desk is).
export type StreamSignal = HubSignal | { kind: 'pairing' }

export type StreamQueue = {
	// `hello`: the first frame, before the snapshot is read.
	hello(): string
	// The frames a new reader starts from (after `hello`): one `desk` and one `pulse` per live
	// desk, the journal tail, every plan, the pairing (a local stream's), `snapshot-end`. Signals
	// noted meanwhile follow it.
	snapshot(): Promise<string[]>
	note(signal: StreamSignal): void
	// When `take` has frames to give (epoch ms; past means now), null when nothing waits.
	dueAt(): number | null
	// The frames due at `now`, in order: closures, then each moved desk's latest line and pulse
	// (an unchanged one is not sent again), journal batches, plans, the pairing. At most one take per
	// `coalesceMs`, so a desk's pulse and line travel at most once per window, latest wins.
	take(now: number): string[]
}

// Per desk, what moved since the last take; `isClosed` comes first (a desk reopened on the same id
// in the same window is sent after its closure).
type DeskMarks = {
	desk: HubDesk | null
	isClosed: boolean
	hasLine: boolean
	hasPulse: boolean
}

type Ledger = {
	marks: Map<string, DeskMarks>
	journal: HubEvent[]
	plans: Map<string, PlanRecord>
	// The last text sent per `line:<id>` and `pulse:<id>`: a projection that did not change is no
	// news.
	sent: Map<string, string>
	// When a desk's status changes on its own (its activity line going stale, activity.ts).
	staleAt: Map<string, { desk: HubDesk; at: number }>
	// What moved beside the desks, the journal and the plans: the hub's pairing.
	moved: Set<'pairing'>
}

export function createStreamQueue(source: StreamSource): StreamQueue {
	const ledger: Ledger = {
		marks: new Map(),
		journal: [],
		plans: new Map(),
		sent: new Map(),
		staleAt: new Map(),
		moved: new Set(),
	}
	let takenAt = 0
	// The newest journal seq the reader holds (the snapshot's tail): never sent again.
	let coveredSeq = 0
	return {
		hello: () => helloText(source),
		async snapshot(): Promise<string[]> {
			const snapshot = await snapshotOf(source, ledger)
			coveredSeq = snapshot.coveredSeq
			return snapshot.texts
		},
		note(signal): void {
			noteSignal(ledger, signal, coveredSeq)
		},
		dueAt: () => dueAt(ledger, takenAt),
		take(now): string[] {
			noteStale(ledger, now)
			const isWindowOpen = now >= takenAt + BRIDGE_LIMITS.coalesceMs
			if (!isWindowOpen || !isPending(ledger)) return []
			takenAt = now
			return drain(source, ledger)
		},
	}
}

function marksOf(ledger: Ledger, deskId: string): DeskMarks {
	const known = ledger.marks.get(deskId)
	if (known) return known
	const marks: DeskMarks = {
		desk: null,
		isClosed: false,
		hasLine: false,
		hasPulse: false,
	}
	ledger.marks.set(deskId, marks)
	return marks
}

function noteDesk(
	ledger: Ledger,
	desk: HubDesk,
	moved: 'line' | 'pulse',
): void {
	const marks = marksOf(ledger, desk.id)
	marks.desk = desk
	if (moved === 'line') marks.hasLine = true
	else marks.hasPulse = true
}

// What the closed desk had moved is dropped with it; its id may come back as a new desk.
function noteClosed(ledger: Ledger, deskId: string): void {
	ledger.marks.set(deskId, {
		desk: null,
		isClosed: true,
		hasLine: false,
		hasPulse: false,
	})
	ledger.staleAt.delete(deskId)
}

// The live desk count (`health`) is the stream's `desk` and `closed` frames already.
function noteSignal(
	ledger: Ledger,
	signal: StreamSignal,
	coveredSeq: number,
): void {
	switch (signal.kind) {
		case 'pairing':
			ledger.moved.add('pairing')
			return
		case 'desk':
			noteDesk(ledger, signal.desk, 'line')
			return
		case 'pulse':
			noteDesk(ledger, signal.desk, 'pulse')
			return
		case 'closed':
			noteClosed(ledger, signal.deskId)
			return
		case 'journal':
			if (signal.event.seq > coveredSeq) ledger.journal.push(signal.event)
			return
		case 'plan':
			ledger.plans.set(signal.plan.id, signal.plan)
			return
		case 'health':
			return
	}
}

// A desk whose status went stale on its own moves now, as if a request had moved it.
function noteStale(ledger: Ledger, now: number): void {
	for (const [deskId, stale] of ledger.staleAt)
		if (stale.at <= now) {
			ledger.staleAt.delete(deskId)
			noteDesk(ledger, stale.desk, 'line')
			noteDesk(ledger, stale.desk, 'pulse')
		}
}

function isPending(ledger: Ledger): boolean {
	return (
		ledger.marks.size > 0 ||
		ledger.journal.length > 0 ||
		ledger.plans.size > 0 ||
		ledger.moved.size > 0
	)
}

function dueAt(ledger: Ledger, takenAt: number): number | null {
	const stale = [...ledger.staleAt.values()].map(each => each.at)
	if (isPending(ledger)) stale.push(takenAt + BRIDGE_LIMITS.coalesceMs)
	if (!stale.length) return null
	return Math.min(...stale)
}

function drain(source: StreamSource, ledger: Ledger): string[] {
	const texts = [
		...deskTexts(source, ledger),
		...journalTexts(source, ledger.journal.splice(0)),
		...planTexts(source, ledger.plans.values()),
	]
	ledger.plans.clear()
	if (ledger.moved.delete('pairing')) sendPairing(texts, source, ledger)
	return texts
}

function sendPairing(
	texts: string[],
	source: StreamSource,
	ledger: Ledger,
): void {
	const text = pairingText(source)
	if (text) send(texts, ledger, 'pairing', text)
}

function deskTexts(source: StreamSource, ledger: Ledger): string[] {
	const texts: string[] = []
	for (const [deskId, marks] of ledger.marks) {
		if (marks.isClosed) {
			texts.push(closedText(source, deskId))
			ledger.sent.delete(`line:${deskId}`)
			ledger.sent.delete(`pulse:${deskId}`)
		}
		const { desk } = marks
		if (desk?.closedAt !== null) continue
		if (marks.hasLine)
			send(texts, ledger, `line:${deskId}`, deskText(source, desk))
		if (!marks.hasPulse) continue
		send(texts, ledger, `pulse:${deskId}`, pulseText(source, desk))
		watchStatus(ledger, desk)
	}
	ledger.marks.clear()
	return texts
}

function send(
	texts: string[],
	ledger: Ledger,
	key: string,
	text: string,
): void {
	if (ledger.sent.get(key) === text) return
	ledger.sent.set(key, text)
	texts.push(text)
}

function watchStatus(ledger: Ledger, desk: HubDesk): void {
	const at = desk.ctx.activity.staleAt()
	if (at === null) ledger.staleAt.delete(desk.id)
	else ledger.staleAt.set(desk.id, { desk, at })
}

// The desks are read in one go once the restore settled (a request naming a desk waits for it the
// same way, router.ts): what was noted before that read is in it, so it is dropped. The journal
// tail covers every event up to its newest seq: those are dropped too, and never sent again.
async function snapshotOf(
	source: StreamSource,
	ledger: Ledger,
): Promise<{ texts: string[]; coveredSeq: number }> {
	await source.hub.restored()
	ledger.marks.clear()
	const deskFrames = source.hub
		.listDesks()
		.toSorted((a, b) =>
			b.liveness.openedAt.localeCompare(a.liveness.openedAt),
		)
		.flatMap(desk => {
			const texts: string[] = []
			send(texts, ledger, `line:${desk.id}`, deskText(source, desk))
			send(texts, ledger, `pulse:${desk.id}`, pulseText(source, desk))
			watchStatus(ledger, desk)
			return texts
		})
	const tail = await source.journal.read({
		after: 0,
		limit: BRIDGE_LIMITS.journalTail,
	})
	const later = ledger.journal.filter(event => event.seq > tail.latest)
	ledger.journal.splice(0, ledger.journal.length, ...later)
	const texts = [
		...deskFrames,
		...journalTexts(source, tail.events),
		...planTexts(source, await plansOf(source)),
	]
	ledger.moved.delete('pairing')
	sendPairing(texts, source, ledger)
	texts.push(snapshotEndText(source))
	return { texts, coveredSeq: tail.latest }
}

// An unreadable plan library (logged by the library) leaves the plans out of the snapshot, never
// the reader without one.
async function plansOf(source: StreamSource): Promise<PlanRecord[]> {
	try {
		return await source.plans.list()
	} catch {
		return []
	}
}

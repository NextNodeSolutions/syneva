import { createEmitter } from '../application/emitter.js'

import type { HubEvent } from '@syneva/contracts/hub'
import type { HubJournal } from '../application/journal.js'
import type { PlanLibrary } from '../application/plan-library.js'
import type { PlanRecord } from '../domain/plan.js'
import type { DeskMove } from './desk-moves.js'
import type { HubDesk } from './hosted-desk.js'

// What moved on the hub, told when it moves (RFC 0001, 3.2): the one source every push transport
// reads - the local hub's stream, the probe, the web's tab sockets. Synchronous and timer-free:
// a listener hears a signal inside the mutation that made it, so it must not read the desk then;
// it notes the desk and projects it later (coalescing is the transport's). A desk signal names
// the desk, not its projection: `hub.summary(desk)` is its listing line, `deskPulse(desk.ctx)`
// (desk-pulse.ts) what its tab watches, both read when the transport sends them.
export type HubSignal =
	// A desk opened or restored, or its summary moved (a commit, a status change, a request's
	// activity stamp, a reopen that changed its record).
	| { kind: 'desk'; desk: HubDesk }
	// A desk left the hub; a desk opened on the same id after it is a new desk.
	| { kind: 'closed'; deskId: string }
	// A desk's pulse moved: a state commit (the revision advanced, the /state cache let go) or a
	// status change.
	| { kind: 'pulse'; desk: HubDesk }
	// A journal event, once on disk, with its seq.
	| { kind: 'journal'; event: HubEvent }
	// A plan record, once kept on disk.
	| { kind: 'plan'; plan: PlanRecord }
	// The hub's health moved: of HubHealth, only the live desk count changes while a hub runs
	// (its version, instance and start never do, and its key is fixed at start).
	| { kind: 'health'; desks: number }

// Function-typed fields: each is handed to a desk or the hub bare and never reads `this`.
export type HubSignals = {
	// A live desk moved: closed desks are silent (their in-flight requests may still commit).
	moved: (desk: HubDesk, move: DeskMove) => void
	// A desk joined the hub (opened, or restored by a restart): `desks` is the new live count.
	joined: (desk: HubDesk, desks: number) => void
	left: (deskId: string, desks: number) => void
	subscribe: (listener: (signal: HubSignal) => void) => () => void
}

export function createHubSignals(io: {
	journal: HubJournal
	plans: PlanLibrary
	log: (line: string) => void
}): HubSignals {
	const hub = createEmitter<HubSignal>('hub', io.log)
	return {
		moved(desk, move): void {
			if (desk.closedAt !== null) return
			if (move === 'pulse') hub.emit({ kind: 'pulse', desk })
			hub.emit({ kind: 'desk', desk })
		},
		joined(desk, desks): void {
			hub.emit({ kind: 'desk', desk })
			hub.emit({ kind: 'pulse', desk })
			hub.emit({ kind: 'health', desks })
		},
		left(deskId, desks): void {
			hub.emit({ kind: 'closed', deskId })
			hub.emit({ kind: 'health', desks })
		},
		// The journal and the plan library keep their own sources (each hears its writes once on
		// disk); a subscriber hears all three as one, and leaves all three at once.
		subscribe(listener) {
			const leaves = [
				hub.subscribe(listener),
				io.journal.subscribe(event => {
					listener({ kind: 'journal', event })
				}),
				io.plans.subscribe(plan => {
					listener({ kind: 'plan', plan })
				}),
			]
			return () => {
				for (const leave of leaves) leave()
			}
		},
	}
}

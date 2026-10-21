// A desk joining and leaving the hub's registry: the one place either happens, so the hub's
// subscribers hear both (hub-signals.ts) whatever opened, restored, replaced or closed the desk.
import { deskClosed } from '../application/journal.js'
import { nowMs } from '../application/time.js'

import { hostDesk, summarize } from './hosted-desk.js'
import { liveDesk, liveDesks } from './hub-desks.js'

import type { HubDeskRecord } from '../domain/hub-registry.js'
import type { ReviewState } from '../domain/review.js'
import type { HubDesk } from './hosted-desk.js'
import type { HubState } from './hub.js'

// The registry is written at once, without the desk: a hub stopped right after a close must not restore it.
export function closeDesk(state: HubState, id: string): boolean {
	if (!markClosed(state, id)) return false
	void state.persist()
	return true
}

export function markClosed(state: HubState, id: string): boolean {
	const desk = liveDesk(state.desks, id)
	if (!desk) return false
	desk.ctx.recordEvent(deskClosed(summarize(desk), desk.record))
	desk.closedAt = nowMs()
	desk.ctx.events.emit({ kind: 'closed', session: desk.record.session })
	state.signals.left(id, liveDesks(state.desks).length)
	state.io.log(
		`desk closed ${id} (${desk.record.root} · ${desk.record.session})`,
	)
	return true
}

export function registerDesk(
	state: HubState,
	review: ReviewState,
	record: HubDeskRecord,
): HubDesk {
	const desk = hostDesk(state.io, review, record, {
		close: () => {
			closeDesk(state, record.id)
		},
		moved: state.signals.moved,
	})
	state.desks.set(record.id, desk)
	state.signals.joined(desk, liveDesks(state.desks).length)
	return desk
}

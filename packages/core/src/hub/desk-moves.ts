// What a hosted desk shows, and the collaborators that move it. Each one is observed where it
// changes, so the hub tells what moved when it moves (hub.subscribe) rather than a reader
// comparing snapshots on a timer.
import type { DeskActivity } from '../application/activity.js'
import type { EventStream } from '../application/events.js'
import type { DeskLiveness } from './liveness.js'

// `summary`: only the dashboard's line for the desk moved (a request stamped its last activity).
// `pulse`: what a desk tab watches moved - a state commit, or the status (an agent parking on or
// leaving the desk's await, an event queued or taken, the activity line set or cleared) - and
// the summary with it, which counts the review and carries the status too.
export type DeskMove = 'summary' | 'pulse'

// Every change to the queue or its waiters moves the status (agentListening, queuedQuestions,
// queuedReviews). A waiter's unpark after the event already took it changes nothing; telling it
// costs a coalesced no-op.
export function observedEvents(
	events: EventStream,
	moved: () => void,
): EventStream {
	return {
		...events,
		emit(event): void {
			events.emit(event)
			moved()
		},
		takeNext() {
			const taken = events.takeNext()
			if (taken) moved()
			return taken
		},
		park(waiter) {
			const unpark = events.park(waiter)
			moved()
			return () => {
				unpark()
				moved()
			}
		},
	}
}

// Setting and clearing the line move the status; the line going stale on its own is no request,
// so a transport learns when from `staleAt`.
export function observedActivity(
	activity: DeskActivity,
	moved: () => void,
): DeskActivity {
	return {
		...activity,
		set(body): void {
			activity.set(body)
			moved()
		},
		clear(): void {
			activity.clear()
			moved()
		},
	}
}

// Every stamp moves the summary's lastActivityAt.
export function observedLiveness(
	liveness: DeskLiveness,
	moved: () => void,
): DeskLiveness {
	return {
		...liveness,
		requestStarted(): void {
			liveness.requestStarted()
			moved()
		},
		requestFinished(): void {
			liveness.requestFinished()
			moved()
		},
	}
}

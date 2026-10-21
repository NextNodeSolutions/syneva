// Coalescing auto-saver for a writer that sends a whole snapshot each time: the desk's
// reviewer slice (there's no manual Save button, so every decision, comment and sign-off
// triggers a save; approving files back-to-back used to fire one full-state POST each,
// saturating the 6-connection-per-origin cap while the server block-serialized multi-MB
// JSON), and the hub's preferences file. It keeps at most one save in flight and collapses
// everything requested while one is outstanding into a single TRAILING save.
//
// The trailing save re-reads getPayload() at send time (latest-wins over a full snapshot),
// so it reflects the newest state, not whatever was current when the intermediate triggers
// fired, and two saves never land out of order. send/getPayload are injected so the coalescing
// logic is unit-testable without a browser or fetch.
export type Saver = {
	// Request a save. Sends immediately if idle; otherwise schedules exactly one trailing save.
	trigger: () => void
	// In-flight OR a trailing save pending - a save is "busy" until the wire is quiet again.
	// The poll's reload branch checks this so it never adopts server state over local
	// mutations that haven't been persisted yet (app/poll.ts).
	isBusy: () => boolean
	// A trailing save is queued behind the one in flight: a page that unloads never sends it.
	isPending: () => boolean
	// Requests a save, then settles.
	drain: (limitMs?: number) => Promise<void>
	// Resolves once everything requested so far has left for the wire (an in-flight save
	// plus one trailing save, if one was pending), or when the limit expires - a wedged
	// endpoint must not block a caller that is leaving anyway (the browser Close). Requests
	// no save itself, so a caller leaving with nothing changed rewrites nothing.
	settle: (limitMs?: number) => Promise<void>
}

// How long settle() waits overall when the caller passes no limit.
const DRAIN_DEFAULT_LIMIT_MS = 2000

// Resolves once `isQuiet` holds or the limit expires, whichever comes first. The save that leaves
// the wire quiet wakes the waiters it finds in `waiters` (nothing re-checks on a tick); the limit
// keeps a wedged transport from holding a departing caller forever.
function settledWithin(
	limitMs: number,
	isQuiet: () => boolean,
	waiters: Set<() => void>,
): Promise<void> {
	return new Promise(resolve => {
		if (isQuiet()) {
			resolve()
			return
		}
		const done = (): void => {
			clearTimeout(limit)
			waiters.delete(done)
			resolve()
		}
		const limit = setTimeout(done, limitMs)
		waiters.add(done)
	})
}

// Each waiter removes itself as it runs, which a Set's iteration allows.
function wake(waiters: ReadonlySet<() => void>): void {
	for (const done of waiters) done()
}

export function createSaver<T>(
	getPayload: () => T,
	send: (payload: T) => Promise<unknown>,
): Saver {
	let isInFlight = false
	let isPending = false
	// Callers of settle() waiting for the wire to go quiet.
	const waiters = new Set<() => void>()

	const run = (): void => {
		isInFlight = true
		// async/await (not .finally) so a rejected save still drains the trailing one - a failed
		// in-flight save must never strand a queued save. Errors are otherwise swallowed:
		// fire-and-forget, no retry machinery (the next mutation will re-trigger anyway).
		void (async () => {
			try {
				await send(getPayload())
			} catch {
				// Swallowed by design: a failed save is not retried here.
			} finally {
				isInFlight = false
				if (isPending) {
					isPending = false
					run()
				} else wake(waiters)
			}
		})()
	}

	const trigger = (): void => {
		if (isInFlight) isPending = true
		else run()
	}

	const isBusy = (): boolean => isInFlight || isPending

	const settle = (limitMs = DRAIN_DEFAULT_LIMIT_MS): Promise<void> =>
		settledWithin(limitMs, () => !isBusy(), waiters)

	return {
		trigger,
		isBusy,
		isPending: () => isPending,
		drain(limitMs?: number): Promise<void> {
			trigger()
			return settle(limitMs)
		},
		settle,
	}
}

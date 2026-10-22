// The web's ops routes (RFC 0001, 6.5), as control-center's budget agent drives them: every one
// with `OPS_TOKEN` as a Bearer (403 otherwise, nothing read), at `BRIDGE_PATHS.opsStatus`,
// `opsBreaker` and `opsDrain`. Tripping the breaker refuses every upgrade and relay at once, then
// drains the people's objects (each socket closes with `saturated`) a page at a time: one call
// does a bounded amount of work however many people there are. The agent follows the pages:
//
//   POST opsBreaker { tripped: true, reason }  ->  BreakerAnswer { drained, next }
//   while next: POST opsDrain { after: next }  ->  DrainPage { drained, next }
//
// A page that fails (5xx, a timeout) is asked again with the same `after`: draining an object
// twice closes nothing more. Draining with no `after` starts over from the first person. A
// person who signs up while the breaker is tripped has no socket to drain (every upgrade is
// refused), so the pages miss no one.

// GET opsStatus: what the agent compares its thresholds against.
export type OpsStatus = BreakerState & {
	hubsSeenLastDay: number
	users: number
}

export type BreakerState = {
	tripped: boolean
	reason: string | null
	// When it was tripped, or last cleared; null when it never was.
	since: string | null
}

// POST opsBreaker: trips (and drains the first page, of `limit` objects) or clears it.
export type BreakerRequest = {
	tripped: boolean
	reason?: string | undefined
	limit?: number | undefined
}

// The breaker as the call left it, with the drain's first page (none on a clear: 0, null).
export type BreakerAnswer = BreakerState & DrainPage

// POST opsDrain, the breaker tripped (409 `NOT_TRIPPED` otherwise): the next page of objects
// after `after`, the `next` of the page before, as is; from the first when absent.
export type DrainRequest = {
	after?: string | undefined
	limit?: number | undefined
}

// How many objects this page drained, and the cursor of the page after it: null once every
// person's object is drained.
export type DrainPage = { drained: number; next: string | null }

export const OPS_LIMITS = {
	// A page's objects, and its default size: one request each from one Worker invocation, six
	// at a time, well inside an invocation's subrequests and its CPU.
	drainPage: 100,
	reasonChars: 500,
} as const

// What the probe does after an attempt ends (RFC 0001, 4.3), shared word for word with the
// frontend's stream client: stop on a revoked or refused token; wait what a close code or an
// edge refusal names, then back off as after anything else; back off exponentially, 1 s to 60 s
// with full jitter, forever. Pure over its inputs: the random draw and the scale come in.
import { BRIDGE_LIMITS, CLOSE_CODES } from '@syneva/contracts/bridge'

// How one attempt ended.
export type AttemptEnd =
	// The socket opened, then closed with this code (1006 when it dropped without a close frame).
	| { kind: 'closed'; code: number; reason: string }
	// The upgrade was answered with this HTTP status instead.
	| { kind: 'refused'; status: number }
	// The web was never reached: a network error, a handshake past its deadline.
	| { kind: 'failed'; reason: string }
	// A ping went unanswered past `pongTimeoutMs`: the probe dropped the socket.
	| { kind: 'silent' }

export type NextStep =
	| { kind: 'stop'; reason: 'revoked' | 'unauthorized' }
	| { kind: 'retry'; waitMs: number }

// Attempts since the web last answered a ping (the exponent of the backoff's ceiling), the draw
// in [0, 1) that jitters it, and the scale every wait is multiplied by (1 outside tests).
export type PolicyInput = { attempt: number; draw: number; scale: number }

const HTTP_UNAUTHORIZED = 401
const HTTP_FORBIDDEN = 403
const HTTP_TOO_MANY_REQUESTS = 429
const HTTP_UNAVAILABLE = 503
const BACKOFF_BASE = 2

// Refused at the edge (the WAF rule, the breaker's edge stage) or by the Worker: wait 5 minutes.
const EDGE_REFUSALS: ReadonlySet<number> = new Set([
	HTTP_FORBIDDEN,
	HTTP_TOO_MANY_REQUESTS,
	HTTP_UNAVAILABLE,
])

// The close codes that name a wait before the next attempt.
const CODE_WAITS: ReadonlyMap<number, number> = new Map([
	[CLOSE_CODES.rate, BRIDGE_LIMITS.rateWaitMs],
	[CLOSE_CODES.tooMany, BRIDGE_LIMITS.tooManyWaitMs],
	[CLOSE_CODES.saturated, BRIDGE_LIMITS.saturatedWaitMs],
])

export function nextStep(end: AttemptEnd, input: PolicyInput): NextStep {
	if (end.kind === 'closed' && end.code === CLOSE_CODES.revoked)
		return { kind: 'stop', reason: 'revoked' }
	if (end.kind === 'refused' && end.status === HTTP_UNAUTHORIZED)
		return { kind: 'stop', reason: 'unauthorized' }
	const named = namedWait(end)
	const waitMs = named ?? backoffMs(input.attempt, input.draw)
	return { kind: 'retry', waitMs: waitMs * input.scale }
}

function namedWait(end: AttemptEnd): number | null {
	if (end.kind === 'closed') return CODE_WAITS.get(end.code) ?? null
	if (end.kind === 'refused' && EDGE_REFUSALS.has(end.status))
		return BRIDGE_LIMITS.saturatedWaitMs
	return null
}

// Exponential from backoffMinMs, capped at backoffMaxMs, with full jitter: a fleet of probes
// that dropped together (a deploy of the web) spreads its reconnects.
function backoffMs(attempt: number, draw: number): number {
	const ceiling = Math.min(
		BRIDGE_LIMITS.backoffMaxMs,
		BRIDGE_LIMITS.backoffMinMs * BACKOFF_BASE ** attempt,
	)
	return draw * ceiling
}

import { BRIDGE_LIMITS } from '@syneva/contracts/bridge'

const BACKOFF_BASE = 2

// The bridge's backoff (RFC 0001, 4.3), for the stream's reconnects and the reads it retries
// alike: exponential from backoffMinMs by `attempt` (0 for the first), capped at backoffMaxMs, with
// full jitter, so a fleet of tabs that failed together (a deploy, a hub restart) spreads out.
export function backoffMs(attempt: number): number {
	const ceiling = Math.min(
		BRIDGE_LIMITS.backoffMaxMs,
		BRIDGE_LIMITS.backoffMinMs * BACKOFF_BASE ** attempt,
	)
	return Math.random() * ceiling
}

// One socket's inbound budget (RFC 0001, 4.4, 6.3 R6): frames and bytes, refilled continuously
// at the per-second rates of BRIDGE_LIMITS and holding at most one second's worth, so a burst
// passes and only a sustained excess runs it dry. Pure over `now`: a Durable Object (no timer)
// and the local stream spend it alike; a bucket lost with its object only ever restarts full.
import { BRIDGE_LIMITS } from '@syneva/contracts/bridge'

const MS_PER_SECOND = 1000

export type RateBucket = {
	readonly frames: number
	readonly bytes: number
	readonly at: number
}

export function fullBucket(now: number): RateBucket {
	return {
		frames: BRIDGE_LIMITS.framesPerSecond,
		bytes: BRIDGE_LIMITS.bytesPerSecond,
		at: now,
	}
}

// The bucket after one inbound frame of `size` bytes at `now`; null when the frame overdraws it,
// and the socket closes with CLOSE_CODES.rate.
export function spendFrame(
	bucket: RateBucket,
	size: number,
	now: number,
): RateBucket | null {
	const seconds = Math.max(0, now - bucket.at) / MS_PER_SECOND
	const frames = refill(bucket.frames, seconds, BRIDGE_LIMITS.framesPerSecond)
	const bytes = refill(bucket.bytes, seconds, BRIDGE_LIMITS.bytesPerSecond)
	if (frames < 1 || bytes < size) return null
	return { frames: frames - 1, bytes: bytes - size, at: now }
}

function refill(tokens: number, seconds: number, perSecond: number): number {
	return Math.min(perSecond, tokens + seconds * perSecond)
}

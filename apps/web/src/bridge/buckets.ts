// A hub socket's inbound budget (RFC 6.1 D2, B2): `framesPerSecond` frames and `bytesPerSecond`
// bytes sustained, one second's worth as the burst, refilled from the time between two frames
// (Date.now deltas: no timer). Held in memory per socket, so hibernation drops it, and a socket
// starts the next wake with a full burst: that costs nothing, since a flood keeps the object awake
// and the bucket with it.
import { BRIDGE_LIMITS } from '@syneva/contracts/bridge'

const MS_PER_SECOND = 1000

type Bucket = { frames: number; bytes: number; at: number }

export class Buckets {
	readonly #held = new Map<string, Bucket>()

	// False when the frame is over the socket's budget: it closes with `rate`.
	spend(socketId: string, bytes: number, now: number): boolean {
		const bucket = this.#held.get(socketId) ?? full(now)
		const elapsed = Math.max(0, now - bucket.at) / MS_PER_SECOND
		const next = {
			frames:
				refilled(
					bucket.frames,
					elapsed,
					BRIDGE_LIMITS.framesPerSecond,
				) - 1,
			bytes:
				refilled(bucket.bytes, elapsed, BRIDGE_LIMITS.bytesPerSecond) -
				bytes,
			at: now,
		}
		this.#held.set(socketId, next)
		return next.frames >= 0 && next.bytes >= 0
	}

	forget(socketId: string): void {
		this.#held.delete(socketId)
	}
}

function full(now: number): Bucket {
	return {
		frames: BRIDGE_LIMITS.framesPerSecond,
		bytes: BRIDGE_LIMITS.bytesPerSecond,
		at: now,
	}
}

function refilled(held: number, elapsedS: number, perSecond: number): number {
	return Math.min(perSecond, held + elapsedS * perSecond)
}

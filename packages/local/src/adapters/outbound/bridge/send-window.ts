// The probe's own pace (RFC 0001, 4.4 and 6.3 R6): never more than `framesPerSecond` frames nor
// `bytesPerSecond` bytes in any second, so the bucket the web's object spends them from (one
// second's worth, refilled at those rates) never runs dry. The window it paces by is a second and
// a margin: frames that left just over a second apart may arrive closer (a socket's buffer, the
// receiver's own loop), and a receiver counting any one second must still never see more. The
// stream's coalescing keeps it far under; a relayed answer of several MiB is what it paces. Pure
// over `now`: a window of what went out in the last second and margin.
import { BRIDGE_LIMITS } from '@syneva/contracts/bridge'

const SECOND_MS = 1000
// Arrival jitter the pace absorbs: at the limit, it costs about a tenth of the throughput.
const JITTER_MARGIN_MS = 100
const WINDOW_MS = SECOND_MS + JITTER_MARGIN_MS

export type SendWindow = ReadonlyArray<{ at: number; bytes: number }>

export const EMPTY_WINDOW: SendWindow = []

// When a frame of `bytes` may go: `now` when the window has room for it, else the moment enough
// of it has passed.
export function sendableAt(
	window: SendWindow,
	bytes: number,
	now: number,
): number {
	const recent = within(window, now)
	let at = now
	const full = recent.length - BRIDGE_LIMITS.framesPerSecond
	if (full >= 0) at = Math.max(at, (recent[full]?.at ?? now) + WINDOW_MS)
	let total = bytes + recent.reduce((sum, each) => sum + each.bytes, 0)
	for (const each of recent) {
		if (total <= BRIDGE_LIMITS.bytesPerSecond) break
		total -= each.bytes
		at = Math.max(at, each.at + WINDOW_MS)
	}
	return at
}

export function withSent(
	window: SendWindow,
	bytes: number,
	now: number,
): SendWindow {
	return [...within(window, now), { at: now, bytes }]
}

function within(window: SendWindow, now: number): SendWindow {
	return window.filter(each => each.at > now - WINDOW_MS)
}

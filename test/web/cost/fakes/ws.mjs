// `ws`, resolved from the local package (which serves the hub's stream with it), so the cost tests
// run from the repo root without a dependency of their own.
import { createRequire } from 'node:module'

const requireFromLocal = createRequire(
	new URL('../../../../packages/local/package.json', import.meta.url),
)

export const { WebSocket } = requireFromLocal('ws')

export const OPEN = 1

// Calls `settle` once with { code, reason, at } at the first of: the peer's close frame arriving,
// the socket closing. `ws` reports a close only when the TCP connection ends, which workerd's dev
// server can hold back for ten seconds after an immediate close (the over-the-cap refusal); the
// frame is what a browser acts on, so it is what a test times. The receiver is `ws`'s own and
// reads the frame as it arrives, hence the underscore.
export function watchClose(socket, settle) {
	let isSettled = false
	const once = (code, reason) => {
		if (isSettled) return
		isSettled = true
		settle({ code, reason: reason.toString('utf8'), at: Date.now() })
	}
	socket.once('open', () => {
		socket._receiver?.once('conclude', once)
	})
	socket.once('close', once)
}

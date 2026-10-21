// The hub's side of liveness: a reader that never pings is closed with `silent` once `silenceMs`
// has passed, and not before; one that pings every `pingIntervalMs` stays. Both open when the run
// starts, so the wait overlaps the other checks; their sockets count against `tabsPerUser` until
// `checkSilence` closes the second, so it runs before the socket cap's check.
import {
	BRIDGE_LIMITS,
	CLOSE_CODES,
	PING_TEXT,
} from '../../packages/contracts/dist/bridge.js'

import { closeReader, readSnapshot } from './stream-client.mjs'

// How late the close may arrive: the hub's timer, then one frame across the loopback.
const LATE_MS = 2000

export async function startSilence({ url, headers }) {
	const [silent, pinging] = await Promise.all([
		readSnapshot(url, headers),
		readSnapshot(url, headers),
	])
	const ping = setInterval(() => {
		pinging.socket.send(PING_TEXT)
	}, BRIDGE_LIMITS.pingIntervalMs)
	return { silent, pinging, ping, openedAt: Date.now() }
}

export async function checkSilence(
	{ report },
	{ silent, pinging, ping, openedAt },
) {
	report.section('silence')
	const deadline = BRIDGE_LIMITS.silenceMs + LATE_MS
	const closed = await Promise.race([
		silent.closed,
		new Promise(resolve => {
			setTimeout(resolve, openedAt + deadline - Date.now(), null)
		}),
	])
	const after = closed ? closed.at - openedAt : null
	report.check(
		`a reader that never pings closes with silent (${CLOSE_CODES.silent}) once silenceMs (${BRIDGE_LIMITS.silenceMs} ms) passed (after ${after} ms)`,
		closed?.code === CLOSE_CODES.silent &&
			after >= BRIDGE_LIMITS.silenceMs - LATE_MS,
	)
	report.check(
		'a reader that pings every pingIntervalMs stays open',
		pinging.socket.readyState === pinging.socket.OPEN,
	)
	clearInterval(ping)
	await Promise.all([closeReader(silent), closeReader(pinging)])
}

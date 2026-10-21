// Upgrades the guards refuse, written on raw sockets their client resets as soon as they are
// written, at once or a moment later: the reset lands before, while or after the hub writes its
// refusal, as a flaky network or an impatient client makes it. The hub outlives every one (a hub
// with no listener for the socket's error died within a few hundred).
import net from 'node:net'

import { HUB_PATHS } from '../../packages/contracts/dist/routes.js'

const RESETS = 400
const RESETS_AT_ONCE = 20
const RESET_SPREAD_MS = 5

export async function checkResets({ report, hub, key }) {
	await report.step(
		`${RESETS} refused upgrades reset by their client leave the hub answering`,
		async () => {
			for (let sent = 0; sent < RESETS; sent += RESETS_AT_ONCE)
				await Promise.all(
					Array.from({ length: RESETS_AT_ONCE }, (_, at) =>
						resetUpgrade(
							hub,
							refusalOf(hub, key, sent + at),
							sent + at,
						),
					),
				)
			const health = await fetch(new URL(HUB_PATHS.health, hub))
			if (!health.ok) throw new Error(`health answered ${health.status}`)
		},
	)
}

// A cross-site Origin, a foreign Host, and on a keyed hub no key: each refusal in turn.
function refusalOf(hub, key, attempt) {
	const { host } = new URL(hub)
	const refusals = [
		{ host, origin: 'http://evil.invalid' },
		{ host: 'evil.invalid', origin: `http://${host}` },
	]
	if (key) refusals.push({ host, origin: `http://${host}` })
	return refusals[attempt % refusals.length]
}

function resetUpgrade(hub, { host, origin }, attempt) {
	const { hostname, port } = new URL(hub)
	const request = [
		`GET ${HUB_PATHS.hubSocket} HTTP/1.1`,
		`Host: ${host}`,
		'Connection: Upgrade',
		'Upgrade: websocket',
		'Sec-WebSocket-Version: 13',
		'Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==',
		`Origin: ${origin}`,
	]
	return new Promise(resolve => {
		const socket = net.connect(Number(port), hostname, () => {
			socket.write(`${request.join('\r\n')}\r\n\r\n`)
			setTimeout(() => {
				socket.resetAndDestroy()
			}, attempt % RESET_SPREAD_MS)
		})
		socket.on('error', () => undefined)
		socket.on('close', resolve)
	})
}

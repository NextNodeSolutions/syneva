// What the policy checks read and drive: the fake's test controls, the attempts it saw, the link
// settled (connected, its pings answered), and the hub's own pairing route.
import { HUB_PATHS } from '../../packages/contracts/dist/routes.js'

import { HTTP_SWITCHING } from './http-wire.mjs'
import { waitUntil } from './hub-process.mjs'

// Every wait the scaled hub keeps is this share of the RFC's.
export const WAIT_SCALE = 0.01
// What a timer, a socket and the loopback add to a wait, at most.
export const SLACK_MS = 400
// How long past a wait a check still waits for the attempt before it fails.
export const LATE_MS = 800
// Pings answered on a link before a check closes it: the web answered, the backoff starts over.
const SETTLED_PINGS = 2
const SETTLE_MS = 10_000

export const scaled = ms => ms * WAIT_SCALE

export async function control(fake, route, body) {
	await fetch(new URL(route, fake.origin), {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify(body),
	})
}

// The attempt after the first `from` the fake saw.
export async function nextUpgrade(fake, from, timeoutMs) {
	await waitUntil(
		() => fake.sockets.upgrades.length > from,
		timeoutMs,
		'an attempt',
	)
	return fake.sockets.upgrades[from]
}

// The hub's socket open again after attempt `from`, and its pings answered.
export async function settledLink({ fake, record }) {
	await waitUntil(
		() =>
			(fake.sockets.hubs.get(record.hubId)?.pings.length ?? 0) >=
			SETTLED_PINGS,
		SETTLE_MS,
		'a settled link',
	)
	return fake.sockets.hubs.get(record.hubId)
}

export function opened(upgrade) {
	return upgrade?.status === HTTP_SWITCHING
}

// POST /api/hub/bridge/reconnect from this machine, as `syneva login` sends it.
export async function reconnect(hub) {
	const response = await fetch(new URL(HUB_PATHS.bridgeReconnect, hub.url), {
		method: 'POST',
	})
	return response.json()
}

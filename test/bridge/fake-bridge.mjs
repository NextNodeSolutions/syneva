#!/usr/bin/env node
// A stand-in for the web's bridge (RFC 0001, section 4), for the probe's conformance check
// (conformance.mjs) and for trying a paired hub by hand: the pairing endpoints, the hub and tab
// sockets, the HTTP relay, and test-only controls under /__. One user, everything in memory.
// Alone: node test/bridge/fake-bridge.mjs [--port <n>] [--interval <s>].
import http from 'node:http'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'

import {
	BRIDGE_PATHS,
	CLOSE_CODES,
} from '../../packages/contracts/dist/bridge.js'

import { FakePairing } from './fake-pairing.mjs'
import { FakeRelay } from './fake-relay.mjs'
import { FakeSockets } from './fake-sockets.mjs'
import {
	failJson,
	HTTP_NOT_FOUND,
	HTTP_OK,
	readJson,
	sendJson,
} from './http-wire.mjs'

const CONTROL_BODY_CAP = 4096

// `interval` is the device-code interval the fake answers with, in seconds (the web's is 5).
export async function startFakeBridge({ port = 0, interval = 1 } = {}) {
	let origin = ''
	const pairing = new FakePairing({ origin: () => origin, interval })
	const sockets = new FakeSockets(pairing)
	const relay = new FakeRelay(sockets)
	const fake = { pairing, sockets, relay }
	const routes = routeTable(fake)
	const server = http.createServer((request, response) => {
		const url = new URL(request.url, origin)
		const route = routes.get(`${request.method} ${url.pathname}`)
		if (route) return route(request, response)
		if (url.pathname.startsWith('/api/'))
			return relay.http(request, response, url)
		return failJson(response, HTTP_NOT_FOUND, 'NOT_FOUND')
	})
	server.on('upgrade', (request, socket, head) => {
		const { pathname } = new URL(request.url, origin)
		if (pathname === BRIDGE_PATHS.hubSocket)
			return sockets.upgradeHub(request, socket, head)
		if (pathname === BRIDGE_PATHS.tabSocket)
			return sockets.upgradeTab(request, socket, head)
		return socket.destroy()
	})
	await new Promise(resolve => server.listen(port, '127.0.0.1', resolve))
	origin = `http://127.0.0.1:${server.address().port}`
	return {
		...fake,
		origin,
		close: () => {
			for (const hub of sockets.hubs.values()) hub.socket.terminate()
			server.closeAllConnections()
			return new Promise(resolve => server.close(resolve))
		},
	}
}

function routeTable({ pairing, sockets }) {
	return new Map([
		[
			`POST ${BRIDGE_PATHS.deviceCode}`,
			(request, response) => pairing.deviceCode(request, response),
		],
		[
			`POST ${BRIDGE_PATHS.deviceToken}`,
			(request, response) => pairing.deviceToken(request, response),
		],
		[
			`DELETE ${BRIDGE_PATHS.hubRevoke}`,
			(request, response) =>
				pairing.revoke(request, response, hubId => {
					sockets.close(hubId, CLOSE_CODES.revoked, 'revoked')
				}),
		],
		...controlRoutes({ pairing, sockets }),
	])
}

// The test-only controls: approve a code, fail the next token asks, close a hub's socket with a
// code, refuse every hub upgrade with a status (0 lifts it), stop answering a hub's pings, read
// what the fake saw.
function controlRoutes({ pairing, sockets }) {
	const control = handle => async (request, response) => {
		handle(await readJson(request, CONTROL_BODY_CAP))
		sendJson(response, HTTP_OK, { ok: true })
	}
	return [
		[
			'POST /__approve',
			(request, response) => pairing.approve(request, response),
		],
		[
			'POST /__token-asks',
			control(({ failures = [] }) => {
				pairing.failNextAsks(failures)
			}),
		],
		[
			'POST /__close',
			control(({ hubId, code, reason }) => {
				sockets.close(hubId, code, reason)
			}),
		],
		[
			'POST /__refuse',
			control(({ status = 0 }) => {
				sockets.refuseWith(status)
			}),
		],
		[
			'POST /__silence',
			control(({ hubId, silent = true }) => {
				sockets.silence(hubId, silent)
			}),
		],
		[
			'GET /__state',
			(_request, response) =>
				sendJson(response, HTTP_OK, {
					hubs: [...sockets.hubs.keys()],
					upgrades: sockets.upgrades,
					revocations: pairing.revocations,
					violations: sockets.violations,
				}),
		],
	]
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const { values } = parseArgs({
		options: {
			port: { type: 'string', default: '0' },
			interval: { type: 'string', default: '1' },
		},
	})
	const fake = await startFakeBridge({
		port: Number(values.port),
		interval: Number(values.interval),
	})
	process.stdout.write(`fake bridge on ${fake.origin}\n`)
}

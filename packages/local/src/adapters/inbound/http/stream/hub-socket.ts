// GET /api/hub/ws: the hub's stream, a WebSocket served by `ws` on node:http's 'upgrade' event.
// The upgrade passes the guards every route passes (core's upgradeRefusal over the same Request
// the Node adapter builds) before any socket opens; a refused one reads the guard's status.
import { BRIDGE_LIMITS, CLOSE_CODES } from '@syneva/contracts/bridge'
import { HUB_PATHS } from '@syneva/contracts/routes'
import { HTTP_NOT_FOUND } from '@syneva/core/http/http'
import { WebSocketServer } from 'ws'

import { refuseUpgrade, upgradeRequest } from '../node-adapter.js'

import { openHubStream } from './hub-stream.js'

import type { IncomingMessage } from 'node:http'
import type { Duplex } from 'node:stream'
import type { ServerOptions, WebSocket } from 'ws'
import type { StreamDeps } from './hub-stream.js'

export type HubSocketDeps = Omit<StreamDeps, 'oversized'> & {
	// The guards' answer to the upgrade request; null lets it through.
	refusal: (request: Request) => Response | null
}

export type HubSocket = {
	// node:http's 'upgrade' listener, handed to the server bare.
	upgrade: (req: IncomingMessage, socket: Duplex, head: Buffer) => void
	// The hub stops: every stream closes with `goingAway` (the client reconnects later); settles
	// once every socket is closed.
	close(): Promise<void>
}

// Only the stream's path upgrades: on a node:http that asks (shouldUpgradeCallback, Node 24.9+),
// any other upgrade request stays a plain request, as it was before the hub had a stream.
export function isHubSocketRequest(req: IncomingMessage): boolean {
	return new URL(req.url ?? '/', PATH_BASE).pathname === HUB_PATHS.hubSocket
}

export function createHubSocket(hub: HubSocketDeps): HubSocket {
	const server = new WebSocketServer(SERVER_OPTIONS)
	const streams = new Set<WebSocket>()
	const deps = { ...hub, oversized: sayOnce(hub.log) }
	// Set once the hub stops: a socket upgraded after the closing round would hold the server
	// open (node:http's close waits for it and nothing would close it), so none is.
	let isClosing = false
	return {
		upgrade(req, socket, head): void {
			if (isClosing) {
				socket.destroy()
				return
			}
			const refusal = refusalOf(req, deps)
			if (refusal) {
				void refuseUpgrade(socket, refusal)
				return
			}
			server.handleUpgrade(req, socket, head, ws => {
				accept(ws, streams, deps)
			})
		},
		async close(): Promise<void> {
			isClosing = true
			await Promise.all([...streams].map(goneAway))
		},
	}
}

// An oversized frame is a bug said once per frame head, not once per reader: every tab that
// reconnects meets the same frame again.
function sayOnce(log: (line: string) => void): (head: string) => void {
	const said = new Set<string>()
	return head => {
		if (said.has(head)) return
		said.add(head)
		log(
			`stream: a frame over ${BRIDGE_LIMITS.frameBytes} bytes is never sent (${head}...); its readers close with ${CLOSE_CODES.rate}`,
		)
	}
}

function refusalOf(req: IncomingMessage, deps: HubSocketDeps): Response | null {
	if (!isHubSocketRequest(req))
		return new Response(null, { status: HTTP_NOT_FOUND })
	const arrival = upgradeRequest(req, 'http')
	return arrival.refusal ?? deps.refusal(arrival.request)
}

// Past `tabsPerUser` open streams, the socket is accepted and closed at once with `tooMany`
// (RFC 4.3): the client reads the code and backs off, which a refused handshake would not say.
function accept(
	ws: WebSocket,
	streams: Set<WebSocket>,
	deps: StreamDeps,
): void {
	// ws closes the socket itself on a protocol error (an oversized or malformed frame) with the
	// matching code; the error event only needs a listener.
	ws.on('error', () => undefined)
	if (streams.size >= BRIDGE_LIMITS.tabsPerUser) {
		ws.close(CLOSE_CODES.tooMany)
		return
	}
	streams.add(ws)
	const end = openHubStream(ws, deps)
	ws.once('close', () => {
		streams.delete(ws)
		end()
	})
}

// Settles on the socket's 'close', which ws always emits (after an error too); a client that never
// answers the close is dropped after ws's close timeout.
async function goneAway(ws: WebSocket): Promise<void> {
	const closed = new Promise<void>(resolve => {
		ws.once('close', () => {
			resolve()
		})
	})
	ws.close(CLOSE_CODES.goingAway)
	await closed
}

// A tab sends pings only: nothing it may send comes near a frame's bound, and permessage-deflate
// would spend the hub's CPU on frames the coalescer already keeps few. ws waits `closeTimeout`
// for a client to answer a close (the hub stopping, a rate close) before it drops the socket: the
// bridge's bound on an answer rather than ws's 30 s (an option @types/ws does not declare yet).
const SERVER_OPTIONS: ServerOptions & { closeTimeout: number } = {
	noServer: true,
	clientTracking: false,
	maxPayload: BRIDGE_LIMITS.frameBytes,
	perMessageDeflate: false,
	closeTimeout: BRIDGE_LIMITS.pongTimeoutMs,
}

// The base a request target is parsed against to read its path (never a host the guards trust).
const PATH_BASE = 'http://127.0.0.1'

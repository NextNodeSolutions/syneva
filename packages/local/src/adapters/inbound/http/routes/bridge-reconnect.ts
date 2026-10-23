// POST /api/hub/bridge/reconnect (RFC 0001, 4.2 step 4): `syneva login` and `syneva logout` tell
// the running hub its pairing changed; the hub reads bridge.json again and answers with its
// pairing once the new probe connected or failed its first attempt (BridgeReconnectAnswer). A
// local hub's own route, served beside the router, never relayed: only a peer on this machine's
// loopback may ask, behind the guards every route passes (Host, Origin, the access key).
import { HUB_PATHS } from '@syneva/contracts/routes'
import { openExchange } from '@syneva/core/http/exchange'
import { HTTP_FORBIDDEN, HTTP_OK, fail, json } from '@syneva/core/http/http'

import type { IncomingMessage } from 'node:http'
import type {
	BridgeReconnectAnswer,
	PairingState,
} from '@syneva/contracts/pairing'
import type { Served } from '@syneva/core/http/exchange'

export type ReconnectDeps = {
	// The guards' answer to the request; null lets it through.
	refusal: (request: Request) => Response | null
	reconnect: () => Promise<PairingState>
}

const LOOPBACK_PEER = /^(?:127\.|::1$|::ffff:127\.)/

const NOT_LOOPBACK = {
	status: HTTP_FORBIDDEN,
	code: 'LOOPBACK_ONLY',
	error: "Only this machine may change the hub's pairing.",
	fix: 'Run `syneva login` or `syneva logout` on the machine the hub runs on.',
}

// Read on every request before the router, on whatever a client sent: a target no URL parses
// (`//[`) is not this route's, and goes to the router, whose Node adapter refuses it as
// MALFORMED_REQUEST; a throw here would stop the hub.
export function isReconnectRequest(req: IncomingMessage): boolean {
	const target = req.url ?? '/'
	if (!URL.canParse(target, PATH_BASE)) return false
	const path = new URL(target, PATH_BASE).pathname
	return req.method === 'POST' && path === HUB_PATHS.bridgeReconnect
}

// The peer as the socket says it, not as a header may claim: a proxy on this machine would make
// every peer loopback, which is why the guards run too.
export function isLoopbackPeer(req: IncomingMessage): boolean {
	return LOOPBACK_PEER.test(req.socket.remoteAddress ?? '')
}

export async function reconnectRoute(
	deps: ReconnectDeps,
	request: Request,
	isFromLoopback: boolean,
): Promise<Served> {
	const exchange = openExchange(request)
	if (!isFromLoopback) return exchange.served(fail(NOT_LOOPBACK))
	const refusal = deps.refusal(request)
	if (refusal) return exchange.served(refusal)
	const answer: BridgeReconnectAnswer = { pairing: await deps.reconnect() }
	return exchange.served(json(HTTP_OK, answer))
}

// The base a request target is parsed against to read its path (never a host the guards trust).
const PATH_BASE = 'http://127.0.0.1'

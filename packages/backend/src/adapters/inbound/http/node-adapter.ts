// node:http under the Fetch API router: an IncomingMessage becomes a Request, the router's
// Response is written back to the ServerResponse. The one module of the hub's HTTP layer that
// knows node:http's request and response; every route reads a Request (exchange.ts).
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

import { HTTP_BAD_REQUEST } from './http.js'

import type {
	IncomingMessage,
	OutgoingHttpHeaders,
	ServerResponse,
} from 'node:http'
import type { Served } from './exchange.js'

// A UI server that needs node:http's own request and response (the dev loop's Vite
// middleware): true once it answered, false to let the hub's own answer stand.
export type NodeUiMiddleware = (
	req: IncomingMessage,
	res: ServerResponse,
) => Promise<boolean>

export type NodeAdapterOptions = {
	// The scheme the request URLs carry: what this server speaks, not what a proxy in front of it may.
	scheme: 'http' | 'https'
	// Offered the reads the router left unclaimed (Served.isUnclaimedRead), so a guard always decides first.
	uiMiddleware?: NodeUiMiddleware | undefined
	// The answer to a throw outside the router (the UI middleware's).
	onError: (error: unknown) => Response
}

export type FetchServe = (request: Request) => Promise<Served>

type NodeListener = (req: IncomingMessage, res: ServerResponse) => void

const BODILESS_METHODS = new Set(['GET', 'HEAD'])
// How much of a request body is pulled ahead of the route reading it: an unread body (a route
// that refuses before reading) is never buffered past this.
const BODY_HIGH_WATER_BYTES = 65_536
// The origin of a request whose Host header names no authority: the URL needs one, and the
// origin guard reads the header itself, so this placeholder never passes for a trusted host.
const PLACEHOLDER_ORIGIN = 'http://127.0.0.1'

export function nodeRequestListener(
	serve: FetchServe,
	options: NodeAdapterOptions,
): NodeListener {
	return (req, res) => {
		void answer(serve, options, req, res)
	}
}

async function answer(
	serve: FetchServe,
	options: NodeAdapterOptions,
	req: IncomingMessage,
	res: ServerResponse,
): Promise<void> {
	const request = toRequest(req, options.scheme, clientGone(res))
	if (!request) return refuseMalformed(res)
	try {
		const served = await serve(request)
		res.once('finish', served.afterSent)
		const isAnswered =
			served.isUnclaimedRead &&
			(await options.uiMiddleware?.(req, res)) === true
		if (!isAnswered) await send(res, served.response)
	} catch (error) {
		if (res.headersSent) res.destroy()
		else await send(res, options.onError(error))
	}
}

// Aborts once the client goes away before the response is handed over: a parked request
// unparks on it, and a desk's activity is stamped on it (router.ts).
function clientGone(res: ServerResponse): AbortSignal {
	const controller = new AbortController()
	res.once('close', () => {
		if (!res.writableFinished) controller.abort()
	})
	return controller.signal
}

// What node:http would answer to a request it could not parse: a Request refuses some of what
// its parser lets through (a TRACE, a header byte the Fetch API rejects).
function refuseMalformed(res: ServerResponse): void {
	res.writeHead(HTTP_BAD_REQUEST, { connection: 'close' })
	res.end()
}

function toRequest(
	req: IncomingMessage,
	scheme: string,
	signal: AbortSignal,
): Request | null {
	const method = req.method ?? 'GET'
	try {
		return new Request(urlOf(req, scheme), {
			method,
			headers: headersOf(req),
			signal,
			...bodyOf(req, method),
		})
	} catch {
		return null
	}
}

// The request target as node:http parsed it until now (path and query only), on the
// authority the client named.
function urlOf(req: IncomingMessage, scheme: string): URL {
	const target = new URL(req.url ?? '/', PLACEHOLDER_ORIGIN)
	const url = new URL(originOf(req.headers.host, scheme))
	url.pathname = target.pathname
	url.search = target.search
	return url
}

// Only a bare authority roots the URL: credentials, a path or a query smuggled into the header
// would change what it parses to, and a default port is dropped from it.
function originOf(host: string | undefined, scheme: string): string {
	const candidate = `${scheme}://${host ?? ''}`
	if (!host || !URL.canParse(candidate)) return PLACEHOLDER_ORIGIN
	const parsed = new URL(candidate)
	if (parsed.host !== host.toLowerCase()) return PLACEHOLDER_ORIGIN
	return parsed.origin
}

// node:http's own reading of the headers, the one the guards have always seen: a repeated
// Host keeps its first value, repeated cookies join with "; ".
function headersOf(req: IncomingMessage): Headers {
	const headers = new Headers()
	for (const [name, value] of Object.entries(req.headers))
		for (const each of [value ?? []].flat()) headers.append(name, each)
	return headers
}

function bodyOf(
	req: IncomingMessage,
	method: string,
): { body: ReadableStream<Uint8Array>; duplex: 'half' } | undefined {
	if (BODILESS_METHODS.has(method)) return undefined
	const strategy = new ByteLengthQueuingStrategy({
		highWaterMark: BODY_HIGH_WATER_BYTES,
	})
	return { body: Readable.toWeb(req, { strategy }), duplex: 'half' }
}

// The status and headers first, as the routes always wrote them; then the body streamed with
// node:http's backpressure, never read whole. A client gone mid-body cancels the source.
async function send(res: ServerResponse, response: Response): Promise<void> {
	if (res.destroyed) {
		await response.body?.cancel()
		return
	}
	res.writeHead(response.status, nodeHeaders(response.headers))
	if (!response.body) {
		res.end()
		return
	}
	await pipeline(Readable.fromWeb(response.body), res).catch(() => undefined)
}

// Headers folds every field into one value except Set-Cookie, which node:http needs as a list
// to write one line per cookie.
function nodeHeaders(headers: Headers): OutgoingHttpHeaders {
	const fields: OutgoingHttpHeaders = {}
	for (const [name, value] of headers)
		if (name !== 'set-cookie') fields[name] = value
	const cookies = headers.getSetCookie()
	if (cookies.length) fields['set-cookie'] = cookies
	return fields
}

// node:http under the Fetch API router: an IncomingMessage becomes a Request, the router's
// Response is written back to the ServerResponse. The one module of the hub's HTTP layer that
// knows node:http's request and response; every route reads a Request (core's http/exchange.ts).
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

import { errorMessage } from '@syneva/core/application/errors'
import {
	HTTP_BAD_REQUEST,
	HTTP_METHOD_NOT_ALLOWED,
	fail,
} from '@syneva/core/http/http'

import type {
	IncomingMessage,
	OutgoingHttpHeaders,
	ServerResponse,
} from 'node:http'
import type { Served } from '@syneva/core/http/exchange'

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
// The Fetch API's forbidden methods, which no Request can carry: node:http hands a TRACE to the
// request listener (a CONNECT never reaches it).
const FORBIDDEN_METHODS = new Set(['CONNECT', 'TRACE', 'TRACK'])
// Every method a hub route answers: the Allow list of the refusal of any other.
const SERVED_METHODS = 'GET, HEAD, POST, DELETE'
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
	const ended = responseEnded(res)
	const { request, refusal } = toRequest(
		req,
		options.scheme,
		clientGone(ended),
	)
	void afterEnd(ended, isHandedOver => {
		if (isHandedOver) drainUnreadBody(req, request)
	})
	const reply = (response: Response): Promise<void> =>
		send(res, response, isBodyAbandoned(req, request))
	if (!request) return reply(refusal)
	try {
		const served = await serve(request)
		// The route committed by returning: its deferred work runs once node:http is done with
		// the response, handed over or abandoned by a client gone first (Served.afterSent).
		void afterEnd(ended, served.afterSent)
		const isAnswered =
			served.isUnclaimedRead &&
			(await options.uiMiddleware?.(req, res)) === true
		if (!isAnswered) await reply(served.response)
	} catch (error) {
		if (res.headersSent) res.destroy()
		else await reply(options.onError(error))
	}
}

// Settles once, when node:http is done with the response: true once it was handed over whole,
// false when the connection closed first. 'close' follows both, and only once.
function responseEnded(res: ServerResponse): Promise<boolean> {
	return new Promise(resolve => {
		res.once('close', () => resolve(res.writableFinished))
	})
}

// Work for the response's end, however it ends; registered after the end (a route still
// running when its client left), it runs at once.
async function afterEnd(
	ended: Promise<boolean>,
	work: (isHandedOver: boolean) => void,
): Promise<void> {
	work(await ended)
}

// Aborts once the client goes away before the response is handed over: a parked request
// unparks on it (routes/await-send.ts).
function clientGone(ended: Promise<boolean>): AbortSignal {
	const controller = new AbortController()
	void afterEnd(ended, isHandedOver => {
		if (!isHandedOver) controller.abort()
	})
	return controller.signal
}

// What the route left of the request body must not hold the keep-alive connection past its
// answer. A body it never read is drained to its end once the response is out, as node:http
// does on its own, and the connection serves the next request. A body it read part way (an
// oversized one, cancelled) can no longer be drained - node:http stops reading a request once
// it is destroyed, yet keeps its connection open - so that answer closes the connection.
function drainUnreadBody(req: IncomingMessage, request: Request | null): void {
	if (!req.complete && request?.bodyUsed !== true) req.resume()
}

function isBodyAbandoned(
	req: IncomingMessage,
	request: Request | null,
): boolean {
	return !req.complete && request?.bodyUsed === true
}

type Arrival =
	| { request: Request; refusal: null }
	| { request: null; refusal: Response }

// A request node:http parsed but no Request can carry (a forbidden method, a target or a
// header the Fetch API rejects) never reaches a route: it is refused here, in the hub's own
// error shape, and sent the way every answer is.
function toRequest(
	req: IncomingMessage,
	scheme: string,
	signal: AbortSignal,
): Arrival {
	const method = req.method ?? 'GET'
	if (FORBIDDEN_METHODS.has(method))
		return { request: null, refusal: methodNotAllowed(method) }
	try {
		const request = new Request(urlOf(req, scheme), {
			method,
			headers: headersOf(req),
			signal,
			...bodyOf(req, method),
		})
		return { request, refusal: null }
	} catch (error) {
		return { request: null, refusal: malformed(error) }
	}
}

function methodNotAllowed(method: string): Response {
	const response = fail({
		status: HTTP_METHOD_NOT_ALLOWED,
		code: 'METHOD_NOT_ALLOWED',
		error: `The hub does not answer ${method} requests.`,
		fix: `Use one of ${SERVED_METHODS}.`,
	})
	response.headers.set('allow', SERVED_METHODS)
	return response
}

function malformed(error: unknown): Response {
	return fail({
		status: HTTP_BAD_REQUEST,
		code: 'MALFORMED_REQUEST',
		error: `The request cannot be read: ${errorMessage(error)}`,
		fix: 'Send a valid request target, and header names and values the Fetch API accepts.',
	})
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

// Pulled off the connection only as the route reads it, never ahead: a route that refuses
// without reading leaves the whole body to drainUnreadBody. (Readable.toWeb would start reading
// at once, which turns node:http's own drain of an unread body off.)
function bodyOf(
	req: IncomingMessage,
	method: string,
): { body: ReadableStream<Uint8Array>; duplex: 'half' } | undefined {
	if (BODILESS_METHODS.has(method)) return undefined
	return { body: ReadableStream.from<Uint8Array>(req), duplex: 'half' }
}

// The status and headers first, as the routes always wrote them; then the body streamed with
// node:http's backpressure, never read whole. A client gone mid-body cancels the source.
async function send(
	res: ServerResponse,
	response: Response,
	shouldCloseConnection: boolean,
): Promise<void> {
	if (res.destroyed) {
		await response.body?.cancel()
		return
	}
	const headers = nodeHeaders(response.headers)
	// node:http ends the connection once a response that says so is out.
	if (shouldCloseConnection) headers.connection = 'close'
	res.writeHead(response.status, headers)
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

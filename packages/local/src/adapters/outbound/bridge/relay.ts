// The web's relayed requests as the probe answers them, in process (RFC 0001, 4.5 step 3): a
// `req` whose path relay-target.ts lets through becomes a Request for the hub's own router on the
// `relayed-over-pairing` channel - its Host/Origin and access guards skipped for it alone, every
// route's own validation run - and its answer goes back by relay-answer.ts, the route's afterSent
// work once the last frame is written: a relayed action opens the editor, stages and resets
// exactly as a local tab's does. At most `inFlightPerUser` at a time (beyond: `err TOO_MANY`); an
// answer past `responseBytes` is `err TOO_LARGE`; a `cancel` aborts the request's signal, drops
// what was not sent, and sends nothing (the web already answered its tab).
import { BRIDGE_LIMITS } from '@syneva/contracts/bridge'
import { errorMessage } from '@syneva/core/application/errors'
import {
	HTTP_BAD_REQUEST,
	HTTP_INTERNAL,
	HTTP_NOT_FOUND,
	fail,
} from '@syneva/core/http/http'

import { readCapped, sendAnswer, webAnswer } from './relay-answer.js'
import { RELAY_ORIGIN, relayTarget } from './relay-target.js'

import type { BridgeFrame } from '@syneva/contracts/bridge'
import type { HubRouter } from '@syneva/core/http/router'
import type { RelayChannel } from './link.js'
import type { Outbox } from './outbox.js'
import type { RelayRequest } from './relay-target.js'

export type RelayDeps = {
	// The hub's web id: every id a relayed path names must carry it.
	hubId: string
	// The hub's router, once the server built it.
	router: () => HubRouter | null
	log: (line: string) => void
}

const HTTP_UNAVAILABLE = 503

type Relaying = { deps: RelayDeps; outbox: Outbox; signal: AbortSignal }

export function createRelay(deps: RelayDeps, outbox: Outbox): RelayChannel {
	const inFlight = new Map<string, AbortController>()
	const settle = async (frame: RelayRequest): Promise<void> => {
		const controller = new AbortController()
		inFlight.set(frame.id, controller)
		const { signal } = controller
		const finished = (): void => {
			if (inFlight.get(frame.id) === controller) inFlight.delete(frame.id)
		}
		await relay({ deps, outbox, signal }, frame, finished)
	}
	return {
		request(frame): void {
			if (inFlight.has(frame.id)) return
			if (inFlight.size >= BRIDGE_LIMITS.inFlightPerUser) {
				send(outbox, { t: 'err', id: frame.id, code: 'TOO_MANY' })
				return
			}
			void settle(frame)
		},
		malformed(id): void {
			const refusal = refused(
				HTTP_BAD_REQUEST,
				'MALFORMED_RELAY',
				`req ${id} does not read as a relayed request.`,
			)
			void sendRefusal(outbox, id, refusal)
		},
		cancel(id): void {
			inFlight.get(id)?.abort()
			inFlight.delete(id)
			outbox.drop(id)
		},
		close(): void {
			for (const controller of inFlight.values()) controller.abort()
			inFlight.clear()
		},
	}
}

// One relay to its end: answered (`finished` once its last frame is written), refused, failed,
// or cancelled (nothing sent once the signal aborted).
async function relay(
	relaying: Relaying,
	frame: RelayRequest,
	finished: () => void,
): Promise<void> {
	const { deps, outbox, signal } = relaying
	try {
		const answer = await answerOf(relaying, frame)
		if (signal.aborted) return finished()
		if (!answer) {
			send(outbox, { t: 'err', id: frame.id, code: 'TOO_LARGE' })
			return finished()
		}
		return sendAnswer(outbox, frame.id, answer, () => {
			answer.afterSent()
			finished()
		})
	} catch (error) {
		if (signal.aborted) return finished()
		deps.log(
			`bridge: relayed ${frame.method} ${frame.path} failed: ${errorMessage(error)}`,
		)
		const failure = refused(
			HTTP_INTERNAL,
			'INTERNAL',
			'The hub failed to answer this request.',
		)
		return sendAnswer(
			outbox,
			frame.id,
			{ response: failure, bytes: await bytesOf(failure) },
			finished,
		)
	}
}

type Answer = { response: Response; bytes: Uint8Array; afterSent: () => void }

// The router's answer read whole, its ids named for the web; a refusal never reaches the router
// (and has no afterSent work); null when the answer is over `responseBytes`.
async function answerOf(
	{ deps, signal }: Relaying,
	frame: RelayRequest,
): Promise<Answer | null> {
	const target = relayTarget(deps.hubId, frame)
	const router = deps.router()
	if ('refusal' in target || !router) {
		const response =
			'refusal' in target
				? refused(HTTP_NOT_FOUND, 'NOT_RELAYED', target.refusal)
				: refused(
						HTTP_UNAVAILABLE,
						'HUB_STARTING',
						'The hub is starting.',
					)
		return {
			response,
			bytes: await bytesOf(response),
			afterSent: () => undefined,
		}
	}
	const request = trustedRequest(frame, target.path, signal)
	const served = await router(request, 'relayed-over-pairing')
	const bytes = await readCapped(served.response, BRIDGE_LIMITS.responseBytes)
	if (!bytes) return null
	const named = webAnswer(
		deps.hubId,
		{ method: frame.method, path: target.path },
		served.response,
		bytes,
	)
	return {
		response: served.response,
		bytes: named,
		afterSent: served.afterSent,
	}
}

// The request as the router reads it: the local path, the web's query and body (JSON, as every
// route that reads a body expects), the relay's signal (a cancel aborts it, as a tab gone does).
function trustedRequest(
	frame: RelayRequest,
	path: string,
	signal: AbortSignal,
): Request {
	const url = `${RELAY_ORIGIN}${path}${frame.query}`
	if (typeof frame.body !== 'string' || frame.method === 'GET')
		return new Request(url, { method: frame.method, signal })
	return new Request(url, {
		method: frame.method,
		headers: { 'content-type': 'application/json' },
		body: frame.body,
		signal,
	})
}

async function sendRefusal(
	outbox: Outbox,
	id: string,
	response: Response,
): Promise<void> {
	const bytes = await bytesOf(response)
	sendAnswer(outbox, id, { response, bytes }, () => undefined)
}

function refused(status: number, code: string, error: string): Response {
	return fail({
		status,
		code,
		error,
		fix: "The web relays a desk's API and the hub routes RFC 0001 (4.7) lists, by web ids of this hub.",
	})
}

async function bytesOf(response: Response): Promise<Uint8Array> {
	return new Uint8Array(await response.arrayBuffer())
}

function send(outbox: Outbox, frame: BridgeFrame): void {
	outbox.send(JSON.stringify(frame))
}

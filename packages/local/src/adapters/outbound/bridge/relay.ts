// The web's relayed requests as the probe answers them, in process (RFC 0001, 4.5 step 3): a
// `req` whose path relay-target.ts lets through becomes a Request for the hub's own router on the
// `relayed-over-pairing` channel - its Host/Origin and access guards skipped for it alone, every
// route's own validation run, and the routes that act for the machine itself narrowed for the web
// (core's exchange.ts) - and its answer goes back by relay-answer.ts, the route's afterSent work
// once the last frame is written. At most `inFlightPerUser` at a time (beyond: `err TOO_MANY`);
// an answer past `responseBytes` is `err TOO_LARGE`; a `cancel` aborts the request's signal,
// drops what was not sent, and sends nothing then or later (the web already answered its tab).
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

// What `inFlightPerUser` counts: the routes the hub runs for the web, until each settles. A
// cancel or a closed socket stops an answer, never its route - routes do not stop on an abort (a
// stage or a comment applies whatever the web does after asking) - so a stopped relay keeps its
// slot until its route has answered. Shared by every socket of one pairing: a reconnect does not
// forget the routes still running for the socket before it.
class Slots {
	#held = 0

	take(): boolean {
		if (this.#held >= BRIDGE_LIMITS.inFlightPerUser) return false
		this.#held += 1
		return true
	}

	give(): void {
		this.#held -= 1
	}
}

// One relay's slot: given back once the relay finished, or once it is both stopped and answered,
// whichever comes first, and only once.
class HeldRelay {
	readonly controller = new AbortController()
	readonly #slots: Slots
	readonly #onFree: () => void
	#isAnswered = false
	#isFree = false

	constructor(slots: Slots, onFree: () => void) {
		this.#slots = slots
		this.#onFree = onFree
	}

	answered(): void {
		this.#isAnswered = true
	}

	// Its answer never goes; the slot goes now if the route answered already, else once it does.
	stop(): void {
		this.controller.abort()
		if (this.#isAnswered) this.free()
	}

	free(): void {
		if (this.#isFree) return
		this.#isFree = true
		this.#slots.give()
		this.#onFree()
	}
}

// The relay for one pairing: a channel per socket (link.ts opens one with each session), all of
// them under the same slots.
export function createRelay(deps: RelayDeps): (outbox: Outbox) => RelayChannel {
	const slots = new Slots()
	return outbox => openChannel(deps, outbox, slots)
}

function openChannel(
	deps: RelayDeps,
	outbox: Outbox,
	slots: Slots,
): RelayChannel {
	const running = new Map<string, HeldRelay>()
	const stop = (id: string, held: HeldRelay): void => {
		held.stop()
		outbox.drop(id)
	}
	return {
		request(frame): void {
			if (running.has(frame.id)) return
			if (!slots.take()) {
				send(outbox, { t: 'err', id: frame.id, code: 'TOO_MANY' })
				return
			}
			const held = new HeldRelay(slots, () => {
				if (running.get(frame.id) === held) running.delete(frame.id)
			})
			running.set(frame.id, held)
			const { signal } = held.controller
			void relay({ deps, outbox, signal }, frame, {
				answered: () => held.answered(),
				finished: () => held.free(),
			})
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
			const held = running.get(id)
			if (held) stop(id, held)
		},
		close(): void {
			for (const [id, held] of running) stop(id, held)
		},
	}
}

// When a relay's route has answered, and when the relay is over: its last frame written, its
// answer dropped, or nothing to send.
type RelayEnds = { answered: () => void; finished: () => void }

// One relay to its end: answered (`finished` once its last frame is written), refused, failed,
// or stopped (nothing sent once the signal aborted: every await is followed by that check before
// anything is handed to the outbox).
async function relay(
	relaying: Relaying,
	frame: RelayRequest,
	ends: RelayEnds,
): Promise<void> {
	const { deps, outbox, signal } = relaying
	try {
		const answer = await answerOf(relaying, frame)
		ends.answered()
		if (signal.aborted) return ends.finished()
		if (!answer) {
			send(outbox, { t: 'err', id: frame.id, code: 'TOO_LARGE' })
			return ends.finished()
		}
		return sendAnswer(outbox, frame.id, answer, () => {
			answer.afterSent()
			ends.finished()
		})
	} catch (error) {
		ends.answered()
		deps.log(
			`bridge: relayed ${frame.method} ${frame.path} failed: ${errorMessage(error)}`,
		)
		const failure = refused(
			HTTP_INTERNAL,
			'INTERNAL',
			'The hub failed to answer this request.',
		)
		// The one check after the one await: a cancel that came while the route ran, or while
		// this was read, sends nothing.
		const bytes = await bytesOf(failure)
		if (signal.aborted) return ends.finished()
		return sendAnswer(
			outbox,
			frame.id,
			{ response: failure, bytes },
			ends.finished,
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

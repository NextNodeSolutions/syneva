import { BRIDGE_LIMITS } from '../../../../packages/contracts/dist/bridge.js'
// A client that keeps a socket open the way RFC 0001, 4.3 says every client does - the probe's own
// policy module, built with the local package, decides what each end of an attempt asks for (stop;
// wait what a close code or an edge refusal names; else exponential backoff, 1 s to 60 s, full
// jitter) - and writes down every attempt and every wait, so a drill reads how often a client
// really tried and holds it against the RFC (rfc-waits.mjs). Its record is a BrowserTab's:
// `trace` in order, { type: 'attempt', at, outcome } and { type: 'retry', at, waitMs, draw, cause }.
import { nextStep } from '../../../../packages/local/dist/adapters/outbound/bridge/policy.js'

import { delay } from './timing.mjs'

export class PolicyClient {
	trace = []
	// { at, outcome } per attempt: 'open', the HTTP status that refused it, or 'failed'.
	attempts = []
	retries = []
	// { at, code } per socket that closed after opening.
	drops = []
	opens = []
	/** @type {boolean} */
	stopped = false
	stopReason = null
	#abort = new AbortController()
	#done = Promise.resolve()

	// `peer` is a FakeHub or FakeTab: `attempt()` opens it, `closed` settles when it ends.
	constructor({ name, peer }) {
		this.name = name
		this.peer = peer
	}

	get isOpen() {
		return this.peer.isOpen
	}

	start() {
		this.#done = this.#loop()
	}

	// The socket ends under the client, as a network change ends it.
	drop() {
		this.peer.terminate()
	}

	async stop() {
		this.stopped = true
		this.#abort.abort()
		this.peer.terminate()
		await this.#done
	}

	async #loop() {
		let attempt = 0
		while (!this.#isStopped()) {
			const end = await this.#once()
			if (this.#isStopped()) return
			if (end.kind === 'closed') attempt = 0
			const draw = Math.random()
			const step = nextStep(end, { attempt, draw, scale: 1 })
			if (step.kind === 'stop') {
				this.stopped = true
				this.stopReason = step.reason
				return
			}
			attempt += 1
			this.#record(this.retries, {
				type: 'retry',
				at: Date.now(),
				waitMs: step.waitMs,
				draw,
				cause: end,
			})
			await delay(step.waitMs, undefined, {
				signal: this.#abort.signal,
			}).catch(() => undefined)
		}
	}

	// A method, not the field: the field is set from outside while this loop awaits.
	#isStopped() {
		return this.stopped
	}

	async #once() {
		const at = Date.now()
		const { outcome, reason } = await this.peer.attempt({
			pingMs: BRIDGE_LIMITS.pingIntervalMs,
		})
		if (outcome === 'open') {
			this.#record(this.attempts, { type: 'attempt', at, outcome })
			this.opens.push(Date.now())
			const closed = await this.peer.closed
			this.drops.push({ at: closed.at, code: closed.code })
			return { kind: 'closed', code: closed.code, reason: closed.reason }
		}
		this.#record(this.attempts, { type: 'attempt', at, outcome })
		if (typeof outcome === 'number')
			return { kind: 'refused', status: outcome }
		return { kind: 'failed', reason }
	}

	#record(list, event) {
		list.push(event)
		this.trace.push(event)
	}
}

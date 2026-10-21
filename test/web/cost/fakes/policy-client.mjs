import { BRIDGE_LIMITS } from '../../../../packages/contracts/dist/bridge.js'
// A client that keeps a socket open the way RFC 0001, 4.3 says every client does - the probe's own
// policy module, built with the local package, decides what each end of an attempt asks for (stop;
// wait what a close code or an edge refusal names; else exponential backoff, 1 s to 60 s, full
// jitter) - and writes down every attempt, so a drill reads how often a client really tried.
import { nextStep } from '../../../../packages/local/dist/adapters/outbound/bridge/policy.js'

import { delay } from './timing.mjs'

export class PolicyClient {
	// { at, outcome } per attempt: 'open', the HTTP status that refused it, or 'failed'.
	attempts = []
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
			const step = nextStep(end, {
				attempt,
				draw: Math.random(),
				scale: 1,
			})
			if (step.kind === 'stop') {
				this.stopped = true
				this.stopReason = step.reason
				return
			}
			attempt += 1
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
			this.attempts.push({ at, outcome })
			this.opens.push(Date.now())
			const closed = await this.peer.closed
			this.drops.push({ at: closed.at, code: closed.code })
			return { kind: 'closed', code: closed.code, reason: closed.reason }
		}
		this.attempts.push({ at, outcome })
		if (typeof outcome === 'number')
			return { kind: 'refused', status: outcome }
		return { kind: 'failed', reason }
	}
}

// One client's story in words: when each attempt went (seconds from `origin`) and how it ended.
export function story(client, origin) {
	const at = ms => ((ms - origin) / 1000).toFixed(1)
	return `${client.name}: ${client.attempts
		.map(each => `${at(each.at)}s ${each.outcome}`)
		.join(', ')}`
}

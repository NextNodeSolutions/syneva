// The relays in flight, by the id the Worker drew. In memory: a relay keeps the object awake (its
// `/relay` call is open), so it never hibernates with one. Each is bound to the hub socket its
// `req` went out on: that socket's frames answer it, its close fails it.
import { BRIDGE_LIMITS } from '@syneva/contracts/bridge'

import type { Relay } from './relay.js'

const HTTP_BAD_GATEWAY = 502

export class Relays {
	readonly #held = new Map<string, Relay>()

	get size(): number {
		return this.#held.size
	}

	get(id: string): Relay | undefined {
		return this.#held.get(id)
	}

	has(id: string): boolean {
		return this.#held.has(id)
	}

	add(relay: Relay): void {
		this.#held.set(relay.id, relay)
	}

	forget(id: string): Relay | undefined {
		const relay = this.#held.get(id)
		this.#held.delete(id)
		return relay
	}

	isFull(): boolean {
		return this.#held.size >= BRIDGE_LIMITS.inFlightPerUser
	}

	// Its hub socket closed: what was not answered is 502, what was is cut.
	failSocket(socketId: string): void {
		for (const [id, relay] of this.#held) {
			if (relay.socketId !== socketId) continue
			relay.fail('HUB_OFFLINE', HTTP_BAD_GATEWAY)
			this.#held.delete(id)
		}
	}

	// The relays whose Worker never cancelled them (its call failed), compared on the object's next
	// event rather than on a timer: failed, and handed back so the hub is told.
	stale(now: number): Relay[] {
		const stale = [...this.#held.values()].filter(relay =>
			relay.isStale(now),
		)
		for (const relay of stale) {
			relay.fail('HUB_TIMEOUT')
			this.#held.delete(relay.id)
		}
		return stale
	}
}

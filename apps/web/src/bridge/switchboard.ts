// The object's state across its sockets while it is awake: the relays in flight, each hub
// socket's budget, the hub sockets it is closing itself. What a hub's frame does (forwarded to
// every tab, an answer to a relay, a close), and what a closed hub socket leaves behind. None of
// it survives hibernation, and none of it needs to: a relay keeps the object awake, a budget
// starts full again, and a socket being closed is gone by the next wake.
import { BRIDGE_LIMITS, CLOSE_CODES } from '@syneva/contracts/bridge'

import { Buckets } from './buckets.js'
import { readHubFrame } from './frames.js'
import { Relays } from './relays.js'
import {
	attachmentOf,
	closeQuietly,
	hubFrame,
	openHubs,
	openTabs,
	sendQuietly,
} from './sockets.js'

import type { BridgeFrame } from '@syneva/contracts/bridge'
import type { RelayFrame } from './frames.js'
import type { Relay } from './relay.js'
import type { HubAttachment, OpenHub } from './sockets.js'

export class Switchboard {
	readonly relays = new Relays()
	readonly #ctx: DurableObjectState
	readonly #buckets = new Buckets()
	// Hub sockets the object is closing itself (replaced, revoked, drained, refused a frame): their
	// frames are no longer read, and their close event tells the tabs nothing more.
	readonly #closing = new Set<string>()

	constructor(ctx: DurableObjectState) {
		this.#ctx = ctx
	}

	// The hub sockets open and not being closed, of one hub or all.
	hubs(hubId?: string): OpenHub[] {
		return openHubs(this.#ctx, this.#closing, hubId)
	}

	isClosing(socketId: string): boolean {
		return this.#closing.has(socketId)
	}

	toTabs(frame: BridgeFrame | string): void {
		const text = typeof frame === 'string' ? frame : JSON.stringify(frame)
		for (const tab of openTabs(this.#ctx)) sendQuietly(tab, text)
	}

	// One text frame of a hub socket: over its size or its budget, not a frame, or another hub's,
	// the socket closes; a relay's frame answers its relay; a stream frame goes to every tab as is.
	fromHub(hub: OpenHub, text: string): void {
		const { attachment } = hub
		this.sweep()
		const bytes = new TextEncoder().encode(text).byteLength
		if (bytes > BRIDGE_LIMITS.frameBytes)
			return this.closeHub(hub, CLOSE_CODES.malformed, 'frame too large')
		if (!this.#buckets.spend(attachment.socketId, bytes, Date.now()))
			return this.closeHub(hub, CLOSE_CODES.rate, 'rate exceeded')
		const says = readHubFrame(text)
		if (says.kind === 'malformed')
			return this.closeHub(hub, CLOSE_CODES.malformed, 'malformed frame')
		if (says.kind === 'relay') return this.#relayFrame(hub, says.frame)
		if (says.kind === 'drop') return undefined
		if (says.hubId !== attachment.hubId)
			return this.closeHub(
				hub,
				CLOSE_CODES.rate,
				'a frame of another hub',
			)
		// The hub's own text, verbatim: the object never re-encodes a stream frame.
		return this.toTabs(text)
	}

	// A relay over before its answer finished: forgotten, and its hub told to stop sending.
	dropRelay(id: string): void {
		const relay = this.relays.forget(id)
		if (relay) this.#cancelOnHub(relay)
	}

	// Relays whose Worker never cancelled them, compared on the object's next event (no timer).
	sweep(): void {
		for (const relay of this.relays.stale(Date.now()))
			this.#cancelOnHub(relay)
	}

	// Closes a hub's socket from the object's side: its relays fail now, and the tabs hear it
	// offline unless the object says otherwise itself (replaced: online again; revoked: told).
	closeHub(hub: OpenHub, code: number, reason: string): void {
		const { socketId } = hub.attachment
		this.#closing.add(socketId)
		this.relays.failSocket(socketId)
		this.#buckets.forget(socketId)
		closeQuietly(hub.socket, code, reason)
		if (code !== CLOSE_CODES.normal && code !== CLOSE_CODES.revoked)
			this.#wentOffline(hub.attachment)
	}

	// A socket closed or failed, by its peer or the object.
	gone(socket: WebSocket): void {
		const attachment = attachmentOf(socket)
		if (attachment?.kind !== 'hub') return
		const wasClosing = this.#closing.delete(attachment.socketId)
		this.#buckets.forget(attachment.socketId)
		this.relays.failSocket(attachment.socketId)
		if (!wasClosing) this.#wentOffline(attachment)
	}

	#relayFrame(hub: OpenHub, frame: RelayFrame): void {
		const relay = this.relays.get(frame.id)
		// A relay already over (cancelled, timed out), or another socket's: passed over.
		if (relay?.socketId !== hub.attachment.socketId) return
		const step = relay.take(frame)
		if (step === 'malformed')
			this.closeHub(hub, CLOSE_CODES.malformed, 'malformed relay frame')
		else if (step === 'done') this.relays.forget(frame.id)
		else if (step === 'cut') this.dropRelay(frame.id)
	}

	#cancelOnHub(relay: Relay): void {
		const hub = this.hubs(relay.hubId).find(
			each => each.attachment.socketId === relay.socketId,
		)
		const cancel: BridgeFrame = { t: 'cancel', id: relay.id }
		if (hub) sendQuietly(hub.socket, JSON.stringify(cancel))
	}

	// Tells the tabs the hub is offline, unless another socket of it is open (it was replaced).
	#wentOffline(attachment: HubAttachment): void {
		if (this.hubs(attachment.hubId).length) return
		this.toTabs(hubFrame(attachment, false))
	}
}

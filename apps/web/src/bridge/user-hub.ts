import {
	BRIDGE_LIMITS,
	CLOSE_CODES,
	PING_TEXT,
	PONG_TEXT,
	RELAY_FAILURE_STATUS,
} from '@syneva/contracts/bridge'
// UserHub: one Durable Object per person, in its switchboard role (RFC 0001, 3.4 and 4). It holds
// the person's sockets, their paired hubs' and their tabs', forwards each hub's live stream to
// every tab and a snapshot to the tab it was asked for, and carries the HTTP relay between a tab's
// request and a hub's answer. It stores nothing: the paired hubs are the truth, the Worker hands
// the object who connects (from D1) with every upgrade, and a tab's snapshot is asked of the hubs
// when it connects, tagged with that tab. It hibernates between
// frames: every socket is accepted through `ctx.acceptWebSocket`, pings are answered by the
// runtime's auto-response (never a wake), and nothing in it waits on a timer, an alarm or a fetch
// of its own (lint and scripts/bundle-check.mjs hold each rule; apps/web/AGENTS.md lists them).
import { DurableObject } from 'cloudflare:workers'

import {
	decodeHeader,
	isHubCard,
	isRelayAsk,
	OBJECT_HEADERS,
	OBJECT_PATHS,
} from './internal.js'
import { failureAnswer, Relay } from './relay.js'
import {
	attachmentOf,
	cardFrame,
	closeQuietly,
	HUB_TAG,
	hubFrame,
	hubTag,
	openTabs,
	refuse,
	sendQuietly,
	TAB_TAG,
	tabTag,
	upgraded,
} from './sockets.js'
import { Switchboard } from './switchboard.js'

import type { BridgeFrame } from '@syneva/contracts/bridge'
import type { HubsOnline } from './internal.js'
import type { HubAttachment } from './sockets.js'

const HTTP_OK = 200
const HTTP_NO_CONTENT = 204
const HTTP_BAD_REQUEST = 400
const HTTP_NOT_FOUND = 404

export class UserHub extends DurableObject<Env> {
	readonly #board: Switchboard

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env)
		this.#board = new Switchboard(ctx)
		this.ctx.setWebSocketAutoResponse(
			new WebSocketRequestResponsePair(PING_TEXT, PONG_TEXT),
		)
	}

	override async fetch(request: Request): Promise<Response> {
		const userId = request.headers.get(OBJECT_HEADERS.user)
		if (!userId) return plain(HTTP_BAD_REQUEST)
		const { pathname } = new URL(request.url)
		if (pathname === OBJECT_PATHS.hub)
			return this.#acceptHub(request, userId)
		if (pathname === OBJECT_PATHS.tab)
			return this.#acceptTab(request, userId)
		if (pathname === OBJECT_PATHS.relay) return this.#relay(request)
		if (pathname === OBJECT_PATHS.hubs) return this.#online()
		if (pathname === OBJECT_PATHS.drain) return this.#drain()
		if (pathname.startsWith(OBJECT_PATHS.cancel))
			return this.#cancel(pathname.slice(OBJECT_PATHS.cancel.length))
		if (pathname.startsWith(OBJECT_PATHS.revoke))
			return this.#revoke(pathname.slice(OBJECT_PATHS.revoke.length))
		return plain(HTTP_NOT_FOUND)
	}

	override webSocketMessage(
		socket: WebSocket,
		message: string | ArrayBuffer,
	): void {
		const attachment = attachmentOf(socket)
		if (!attachment) return
		// A tab only ever pings, which the auto-response answers; anything else is not its to say.
		if (attachment.kind === 'tab')
			closeQuietly(socket, CLOSE_CODES.malformed, 'tabs send nothing')
		else if (this.#board.isClosing(attachment.socketId)) return
		else if (typeof message === 'string')
			this.#board.fromHub({ socket, attachment }, message)
		else
			this.#board.closeHub(
				{ socket, attachment },
				CLOSE_CODES.malformed,
				'binary frame',
			)
	}

	override webSocketClose(socket: WebSocket): void {
		this.#board.gone(socket)
	}

	override webSocketError(socket: WebSocket, error: unknown): void {
		const reason = error instanceof Error ? error.message : String(error)
		const kind = attachmentOf(socket)?.kind
		console.error(JSON.stringify({ event: 'socket-error', kind, reason }))
		this.#board.gone(socket)
	}

	#acceptHub(request: Request, userId: string): Response {
		const card = decodeHeader(request.headers.get(OBJECT_HEADERS.hub))
		if (!isHubCard(card)) return plain(HTTP_BAD_REQUEST)
		const others = new Set(
			this.#board
				.hubs()
				.map(each => each.attachment.hubId)
				.filter(hubId => hubId !== card.hubId),
		)
		if (others.size >= BRIDGE_LIMITS.hubsPerUser) return refuse(this.ctx)
		// One socket per hub: the newer one wins (a probe that reconnected before the web saw its
		// old socket drop), and the tabs hear it online, never offline in between.
		for (const older of this.#board.hubs(card.hubId))
			this.#board.closeHub(older, CLOSE_CODES.normal, 'replaced')
		const { 0: client, 1: server } = new WebSocketPair()
		this.ctx.acceptWebSocket(server, [HUB_TAG, hubTag(card.hubId)])
		const attachment: HubAttachment = {
			kind: 'hub',
			socketId: crypto.randomUUID(),
			userId,
			hubId: card.hubId,
			name: card.name,
			version: card.version,
			connectedAt: card.lastSeenAt ?? new Date().toISOString(),
		}
		server.serializeAttachment(attachment)
		this.#board.toTabs(hubFrame(attachment, true))
		return upgraded(client)
	}

	#acceptTab(request: Request, userId: string): Response {
		const cards = decodeHeader(request.headers.get(OBJECT_HEADERS.hubs))
		if (!Array.isArray(cards) || !cards.every(isHubCard))
			return plain(HTTP_BAD_REQUEST)
		if (openTabs(this.ctx).length >= BRIDGE_LIMITS.tabsPerUser)
			return refuse(this.ctx)
		const { 0: client, 1: server } = new WebSocketPair()
		const socketId = crypto.randomUUID()
		this.ctx.acceptWebSocket(server, [TAB_TAG, tabTag(socketId)])
		server.serializeAttachment({ kind: 'tab', socketId, userId })
		const open = new Map(
			this.#board
				.hubs()
				.map(each => [each.attachment.hubId, each.socket]),
		)
		// The object keeps no snapshot: each hub sends its own, every frame of it tagged with this
		// socket's id, and only this tab gets it (RFC 6.1 B10: a connect never resends the person's
		// other tabs a snapshot they hold). A hub before tags answers untagged, to every tab.
		const snapshotAsk = JSON.stringify({
			t: 'snapshot?',
			tag: socketId,
		} satisfies BridgeFrame)
		for (const card of cards) {
			const hub = open.get(card.hubId)
			sendQuietly(server, JSON.stringify(cardFrame(card, Boolean(hub))))
			if (hub) sendQuietly(hub, snapshotAsk)
		}
		sendQuietly(
			server,
			JSON.stringify({ t: 'hubs-end' } satisfies BridgeFrame),
		)
		return upgraded(client)
	}

	async #relay(request: Request): Promise<Response> {
		const ask: unknown = await request.json().catch(() => null)
		if (!isRelayAsk(ask) || this.#board.relays.has(ask.id))
			return plain(HTTP_BAD_REQUEST)
		this.#board.sweep()
		const [hub] = this.#board.hubs(ask.hubId)
		if (!hub)
			return failureAnswer(
				'HUB_OFFLINE',
				RELAY_FAILURE_STATUS.HUB_OFFLINE,
			)
		if (this.#board.relays.isFull())
			return failureAnswer('TOO_MANY', RELAY_FAILURE_STATUS.TOO_MANY)
		const { id, hubId, method, path, query, body } = ask
		const ids = { id, hubId, socketId: hub.attachment.socketId }
		const relay = new Relay(ids, Date.now(), () => {
			this.#board.dropRelay(id)
		})
		this.#board.relays.add(relay)
		const frame: BridgeFrame = { t: 'req', id, method, path, query, body }
		sendQuietly(hub.socket, JSON.stringify(frame))
		return relay.answer
	}

	#cancel(id: string): Response {
		this.#board.relays.get(id)?.fail('CANCELLED')
		this.#board.dropRelay(id)
		return plain(HTTP_NO_CONTENT)
	}

	#revoke(hubId: string): Response {
		const hubs = this.#board.hubs(hubId)
		for (const hub of hubs)
			this.#board.closeHub(hub, CLOSE_CODES.revoked, 'revoked')
		const [revoked] = hubs
		if (revoked) this.#board.toTabs(hubFrame(revoked.attachment, false))
		return plain(HTTP_NO_CONTENT)
	}

	// The breaker: every socket closes with `saturated` and waits 5 minutes before it tries again;
	// every relay in flight fails with its hub's socket.
	#drain(): Response {
		for (const hub of this.#board.hubs())
			this.#board.closeHub(hub, CLOSE_CODES.saturated, 'saturated')
		for (const tab of openTabs(this.ctx))
			closeQuietly(tab, CLOSE_CODES.saturated, 'saturated')
		return plain(HTTP_NO_CONTENT)
	}

	#online(): Response {
		const hubIds = this.#board.hubs().map(each => each.attachment.hubId)
		const online: HubsOnline = { online: [...new Set(hubIds)] }
		return new Response(JSON.stringify(online), {
			status: HTTP_OK,
			headers: { 'content-type': 'application/json' },
		})
	}
}

function plain(status: number): Response {
	return new Response(null, { status })
}

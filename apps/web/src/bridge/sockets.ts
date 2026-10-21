// The object's sockets as the Hibernation API keeps them: tagged at accept (`hub`, `hub:<id>`,
// `tab`), each with its attachment, written once at accept and the only thing that survives a
// wake. What a socket is, the ones open now, the `hub` frames that say where a hub stands, and
// sends and closes that never throw at a socket closing as they go.
import { CLOSE_CODES } from '@syneva/contracts/bridge'

import type { BridgeFrame } from '@syneva/contracts/bridge'
import type { HubCard } from './internal.js'

export type HubAttachment = {
	kind: 'hub'
	socketId: string
	userId: string
	hubId: string
	name: string
	version: string
	connectedAt: string
}
export type TabAttachment = { kind: 'tab'; socketId: string; userId: string }
export type Attachment = HubAttachment | TabAttachment

export type OpenHub = { socket: WebSocket; attachment: HubAttachment }

export const HUB_TAG = 'hub'
export const TAB_TAG = 'tab'
// A socket accepted only to be closed at once (over the cap): never counted, never read.
const REFUSED_TAG = 'refused'
const HTTP_SWITCHING = 101

export function hubTag(hubId: string): string {
	return `hub:${hubId}`
}

// What a socket was accepted as; null for one accepted only to be refused.
export function attachmentOf(socket: WebSocket): Attachment | null {
	const raw: unknown = socket.deserializeAttachment()
	if (typeof raw !== 'object' || raw === null) return null
	const fields: Record<string, unknown> = Object.fromEntries(
		Object.entries(raw),
	)
	const { kind, socketId, userId } = fields
	if (typeof socketId !== 'string' || typeof userId !== 'string') return null
	if (kind === 'tab') return { kind, socketId, userId }
	const { hubId, name, version, connectedAt } = fields
	if (
		kind !== 'hub' ||
		typeof hubId !== 'string' ||
		typeof name !== 'string' ||
		typeof version !== 'string' ||
		typeof connectedAt !== 'string'
	)
		return null
	return { kind, socketId, userId, hubId, name, version, connectedAt }
}

// The hub sockets open and not being closed by the object, of one hub or all.
export function openHubs(
	ctx: DurableObjectState,
	closing: ReadonlySet<string>,
	hubId?: string,
): OpenHub[] {
	const sockets = ctx.getWebSockets(hubId ? hubTag(hubId) : HUB_TAG)
	return sockets.flatMap(socket => {
		const attachment = attachmentOf(socket)
		if (attachment?.kind !== 'hub' || socket.readyState !== WebSocket.OPEN)
			return []
		if (closing.has(attachment.socketId)) return []
		return [{ socket, attachment }]
	})
}

export function openTabs(ctx: DurableObjectState): WebSocket[] {
	return ctx
		.getWebSockets(TAB_TAG)
		.filter(socket => socket.readyState === WebSocket.OPEN)
}

// The `hub` frame a tab reads: where one of the person's hubs stands.
export function cardFrame(card: HubCard, isOnline: boolean): BridgeFrame {
	const { hubId, name, version, lastSeenAt } = card
	return { t: 'hub', hubId, name, online: isOnline, version, lastSeenAt }
}

export function hubFrame(
	attachment: HubAttachment,
	isOnline: boolean,
): BridgeFrame {
	return cardFrame(
		{
			hubId: attachment.hubId,
			name: attachment.name,
			version: attachment.version,
			lastSeenAt: attachment.connectedAt,
		},
		isOnline,
	)
}

// Over the cap: the upgrade succeeds and the socket closes at once with `tooMany`, which the
// client's policy reads (wait a minute), where an HTTP refusal would read as a failed upgrade.
export function refuse(ctx: DurableObjectState): Response {
	const { 0: client, 1: server } = new WebSocketPair()
	ctx.acceptWebSocket(server, [REFUSED_TAG])
	server.close(CLOSE_CODES.tooMany, 'too many sockets')
	return upgraded(client)
}

export function upgraded(client: WebSocket): Response {
	return new Response(null, { status: HTTP_SWITCHING, webSocket: client })
}

// A send to a socket that may be closing as it goes: its close event does the rest.
export function sendQuietly(socket: WebSocket, text: string): void {
	try {
		socket.send(text)
	} catch {
		// Closing: nothing to tell it any more.
	}
}

export function closeQuietly(
	socket: WebSocket,
	code: number,
	reason: string,
): void {
	try {
		socket.close(code, reason)
	} catch {
		// Already closed: its close event does the rest.
	}
}

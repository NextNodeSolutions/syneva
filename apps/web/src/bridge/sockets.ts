// The object's sockets as the Hibernation API keeps them: tagged at accept (`hub`, `hub:<id>`,
// `tab`, `tab:<socket id>`), each with its attachment, written once at accept and the only thing that survives a
// wake. What a socket is, the ones open now, the `hub` frames that say where a hub stands, and
// sends and closes that never throw at a socket closing as they go.
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
const HTTP_SWITCHING = 101

export function hubTag(hubId: string): string {
	return `hub:${hubId}`
}

// A tab by its socket id: what the object tags the snapshot it asks for that tab with.
export function tabTag(socketId: string): string {
	return `tab:${socketId}`
}

// What a socket was accepted as; null for an attachment that does not read as one.
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

// Every tab open, or the one a socket id names (none once it closed).
export function openTabs(
	ctx: DurableObjectState,
	socketId?: string,
): WebSocket[] {
	return ctx
		.getWebSockets(socketId ? tabTag(socketId) : TAB_TAG)
		.filter(socket => socket.readyState === WebSocket.OPEN)
}

// The `hub` frame a tab reads: where one of the person's hubs stands.
export function cardFrame(card: HubCard, isOnline: boolean): BridgeFrame {
	const { hubId, name, version, lastSeenAt } = card
	return { t: 'hub', hubId, name, online: isOnline, version, lastSeenAt }
}

// An offline hub's `hub` frame when the object refused its upgrade at the cap, `at` that refusal.
export function refusedFrame(card: HubCard, at: string): BridgeFrame {
	const { hubId, name, version, lastSeenAt } = card
	return {
		t: 'hub',
		hubId,
		name,
		online: false,
		version,
		lastSeenAt,
		refusedAt: at,
	}
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

export function upgraded(
	client: WebSocket,
	headers: Record<string, string> = {},
): Response {
	return new Response(null, {
		status: HTTP_SWITCHING,
		webSocket: client,
		headers,
	})
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

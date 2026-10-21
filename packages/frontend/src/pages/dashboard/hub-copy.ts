import { relativeTime } from './format'

import type { HubDesk, HubRef } from '@entities/hub/model'

// What a desk says of the hub it lives on. Only the web has desks of several hubs, and only when
// there is more than one does a desk name its hub (a lone hub would repeat the page's own).

// A desk whose hub has no socket open: its listing stays (the web keeps what it last said) but
// nothing can reach the hub, so every action that would relay is out of reach.
export function isHubOffline(desk: Pick<HubDesk, 'hub'>): boolean {
	return desk.hub !== null && !desk.hub.isOnline
}

// "offline, seen 4m ago": the hub's last connection as the web says it.
export function offlineWords(hub: HubRef, now: number): string {
	if (hub.lastSeenAt === null) return 'offline'
	return `offline, seen ${relativeTime(hub.lastSeenAt, now)}`
}

// The hub's name when the page follows several, else nothing.
export function hubName(
	desk: Pick<HubDesk, 'hub'>,
	hasManyHubs: boolean,
): string | null {
	if (!hasManyHubs || !desk.hub) return null
	return desk.hub.name
}

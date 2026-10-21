import { useSyncExternalStore } from 'react'

import { hubLink, hubStatus } from './link'
import { forgetDesk, hubView, subscribeHub } from './stream'

import type { HubLink, HubStatus } from './link'
import type { HubDesk, HubHealth } from './model'

export type HubView = {
	// Null until the stream's first snapshot is whole.
	desks: HubDesk[] | null
	status: HubStatus
	arrivedIds: ReadonlySet<string>
	health: HubHealth | null
	link: HubLink
	// The hub answered this page's close: the desk leaves the listing now, its `closed` frame
	// follows.
	forget: (desk: HubDesk) => void
}

// The hub's listing and how it answers, from the hub's stream. Each part is read on its own, so
// a pulse or a journal batch does not render a reader of the listing again.
export function useHub(): HubView {
	const listing = useSyncExternalStore(subscribeHub, () => hubView().listing)
	const stream = useSyncExternalStore(subscribeHub, () => hubView().stream)
	const identity = useSyncExternalStore(
		subscribeHub,
		() => hubView().identity,
	)
	const health = useSyncExternalStore(subscribeHub, () => hubView().health)
	return {
		desks: listing.desks,
		status: hubStatus(stream),
		arrivedIds: listing.arrivedIds,
		health,
		link: hubLink(stream, identity),
		forget: forgetDesk,
	}
}

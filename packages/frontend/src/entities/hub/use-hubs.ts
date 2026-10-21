import { useMemo, useSyncExternalStore } from 'react'

import { hubView, subscribeHub } from './stream'

import type { HubMode } from './mode'
import type { HubRef } from './model'

// Local or web (mode.ts); null until the stream's first frame says.
export function useHubMode(): HubMode | null {
	return useSyncExternalStore(subscribeHub, () => hubView().mode)
}

// The hubs the page has heard of, the ones online first, then by name. One hub on a local page.
export function useHubList(): readonly HubRef[] {
	const hubs = useSyncExternalStore(subscribeHub, () => hubView().hubs)
	return useMemo(
		() =>
			[...hubs.values()].toSorted(
				(a, b) =>
					Number(b.isOnline) - Number(a.isOnline) ||
					a.name.localeCompare(b.name),
			),
		[hubs],
	)
}

// Whether the desks must say which hub they are on: with one hub they would repeat the page's own.
export function useHasManyHubs(): boolean {
	return useSyncExternalStore(subscribeHub, () => hubView().hubs.size > 1)
}

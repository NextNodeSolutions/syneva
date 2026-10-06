import { useSyncExternalStore } from 'react'

import { placeKey, subscribePlace } from './router'

import type { Place } from './router'

// The URL the page is at, re-rendering its reader whenever the in-page router (or Back and
// Forward) moves it.
export function usePlace(): Place {
	const key = useSyncExternalStore(subscribePlace, placeKey)
	const url = new URL(key, window.location.origin)
	return { pathname: url.pathname, search: url.search }
}

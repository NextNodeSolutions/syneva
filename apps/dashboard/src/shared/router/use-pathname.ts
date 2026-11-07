import { useSyncExternalStore } from 'react'

import { readPathname, subscribeToLocation } from './location'

export function usePathname(): string {
	return useSyncExternalStore(subscribeToLocation, readPathname)
}

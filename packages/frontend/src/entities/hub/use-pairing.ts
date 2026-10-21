import { useSyncExternalStore } from 'react'

import { hubView, subscribeHub } from './stream'

import type { HubPairing } from './pairing'

// The hub's pairing with the web, as its stream last said it; null until it has (a hub older
// than the probe never does).
export function usePairing(): HubPairing | null {
	return useSyncExternalStore(subscribeHub, () => hubView().pairing)
}

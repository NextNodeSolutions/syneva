import { useSyncExternalStore } from 'react'

const subscribe = (): (() => void) => () => undefined

// False in the server's markup and through hydration, true once the island runs: the form leaves the browser's own checks on until its script can do them.
export const useHydrated = (): boolean =>
	useSyncExternalStore(
		subscribe,
		() => true,
		() => false,
	)

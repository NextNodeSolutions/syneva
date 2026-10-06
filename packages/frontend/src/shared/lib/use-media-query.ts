import { useCallback, useSyncExternalStore } from 'react'

// Whether a media query matches now, kept in step as it changes (a window resized across a
// breakpoint, a device turned).
export function useMediaQuery(query: string): boolean {
	const subscribe = useCallback(
		(onChange: () => void) => {
			const list = window.matchMedia(query)
			list.addEventListener('change', onChange)
			return (): void => list.removeEventListener('change', onChange)
		},
		[query],
	)
	return useSyncExternalStore(
		subscribe,
		() => window.matchMedia(query).matches,
	)
}

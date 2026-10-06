import { useLayoutEffect } from 'react'

import type { RefObject } from 'react'

// When a region leaves while focus is inside it (the empty overview once the first desk
// arrives), focus moves to `targetId` instead of falling to the body. A layout effect: its
// cleanup runs before the region's nodes are removed, while the focused element is still in it.
export function useFocusHandoff(
	root: RefObject<Element | null>,
	targetId: string,
): void {
	useLayoutEffect(() => {
		const region = root.current
		return () => {
			if (region?.contains(document.activeElement))
				document
					.getElementById(targetId)
					?.focus({ preventScroll: true })
		}
	}, [root, targetId])
}

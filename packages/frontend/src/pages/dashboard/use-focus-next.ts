import { useCallback, useEffect, useRef, useState } from 'react'

import { focusTarget } from './focus-targets'

// Where focus goes next, and what to do once that step is over (whether or not the element
// came).
type FocusRequest = { id: string; onPlaced: (() => void) | undefined }

export type FocusNext = (id: string, onPlaced?: () => void) => void

// Focus to move once the element it names is on screen: a control swapped for another (Close
// for Keep and back), a row that left for its neighbour. Asked for from an event handler, it
// is placed by an effect after the render that shows the element - the DOM's focus is outside
// React. Each request renders once (its own state tick, batched with the caller's updates)
// and is settled by that render's effect: every caller names an element its own update puts
// on screen, so a target that did not come is dropped rather than kept to steal focus from
// whatever the reader does minutes later. `onPlaced` runs after that effect.
export function useFocusNext(): FocusNext {
	const pending = useRef<FocusRequest | null>(null)
	const [, setRequests] = useState(0)
	useEffect(() => {
		const request = pending.current
		if (!request) return
		pending.current = null
		focusTarget(request.id)
		request.onPlaced?.()
	})
	return useCallback((id: string, onPlaced?: () => void): void => {
		pending.current = { id, onPlaced }
		setRequests(count => count + 1)
	}, [])
}

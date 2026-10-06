import { useCallback, useEffect, useRef, useState } from 'react'

import { focusTarget } from './focus-targets'

// Where focus goes next, and what to do once that step is over (whether or not the element
// came).
type FocusRequest = { id: string; onPlaced: (() => void) | undefined }

export type FocusNext = (id: string, onPlaced?: () => void) => void

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

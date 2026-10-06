import { useState } from 'react'

import { useKeyboardFocusWithin } from '@shared/lib/use-keyboard-focus-within'

export type ListHold = {
	isHeld: boolean
	bind: (element: HTMLElement | null) => void
	listeners: { onPointerEnter: () => void; onPointerLeave: () => void }
}

// Focus is read from the DOM rather than tracked from blur events: when the focused row itself goes (a close, an agent-closed desk) no blur comes, and a tracked flag would hold the order for good.
// Only keyboard focus counts - a mouse user is held by the pointer alone.
export function useListHold(): ListHold {
	const [element, setElement] = useState<HTMLElement | null>(null)
	const [isPointerIn, setPointerIn] = useState(false)
	const isFocusIn = useKeyboardFocusWithin(element)
	return {
		isHeld: isPointerIn || isFocusIn,
		bind: setElement,
		listeners: {
			onPointerEnter: () => setPointerIn(true),
			onPointerLeave: () => setPointerIn(false),
		},
	}
}

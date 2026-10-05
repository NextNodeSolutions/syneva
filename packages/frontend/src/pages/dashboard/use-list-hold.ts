import { useState } from 'react'

import { useKeyboardFocusWithin } from '@shared/lib/use-keyboard-focus-within'

export type ListHold = {
	// The pointer or keyboard focus is inside the listing.
	isHeld: boolean
	// Takes the listing's element (main#desks, through its ref): what "inside" means.
	bind: (element: HTMLElement | null) => void
	listeners: { onPointerEnter: () => void; onPointerLeave: () => void }
}

// Whether the reviewer is in the listing - pointing at it or tabbing through it - so its
// order holds still under them (see use-held-order.ts). Focus is read from the DOM rather than
// tracked from blur events: when the focused row itself goes (an agent closed its desk, a
// close from here), no blur comes, and a tracked flag would hold the order for good. Only
// keyboard focus counts: focus a mouse left in the listing (a click on its bare space, focus
// put back after a click) would hold it with the pointer long gone; a mouse user is held by
// the pointer alone.
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

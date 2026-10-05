import { useCallback, useSyncExternalStore } from 'react'

// Re-read on every focus arrival, and on a departure only when focus goes nowhere (a click on
// bare page, the window losing focus, Safari's unfocused buttons). A move between two elements
// fires focusout - with the body already active - then focusin, with a microtask checkpoint
// between them: a store change there renders synchronously, so read on that focusout the hook
// would report "outside" for one render on every Tab. A key or a press can change what
// :focus-visible matches without moving focus, so both are read too.
function subscribeFocus(onChange: () => void): () => void {
	const onFocusOut = (event: FocusEvent): void => {
		if (event.relatedTarget === null) onChange()
	}
	document.addEventListener('focusin', onChange)
	document.addEventListener('focusout', onFocusOut)
	document.addEventListener('keydown', onChange)
	document.addEventListener('pointerdown', onChange)
	return () => {
		document.removeEventListener('focusin', onChange)
		document.removeEventListener('focusout', onFocusOut)
		document.removeEventListener('keydown', onChange)
		document.removeEventListener('pointerdown', onChange)
	}
}

// Whether keyboard focus is inside `element`: focus there that shows its ring (:focus-visible).
// Focus a mouse leaves behind - a click on bare space in a focusable container, or focus a
// script placed after a click - is not the reader working through the element, and must not
// count as their presence there. Focus is outside React, so it is read as an external store: on
// the events above, and again on every render - which also catches focus lost with no event at
// all (Chromium fires none when the focused element is removed; focus falls to the body).
export function useKeyboardFocusWithin(element: HTMLElement | null): boolean {
	const isInside = useCallback((): boolean => {
		const active = document.activeElement
		return (
			active !== null &&
			element?.contains(active) === true &&
			active.matches(':focus-visible')
		)
	}, [element])
	return useSyncExternalStore(subscribeFocus, isInside)
}

import { useCallback, useSyncExternalStore } from 'react'

// A move between two elements fires focusout (body already active) then focusin with a microtask checkpoint between: a store change there renders synchronously, so reading at focusout would report "outside" for one render on every Tab.
// A key or press can change :focus-visible matching without moving focus, so both are read too.
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

// Focus is outside React, so it is read as an external store: on the events above and again on every render - which also catches focus lost with no event at all (Chromium fires none when the focused element is removed).
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

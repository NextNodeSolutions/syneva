import { useEffect } from 'react'

import type { RefObject } from 'react'

export type DismissCause = 'escape' | 'outside' | 'resize'

type DismissOptions = {
	isOpen: boolean
	// What counts as inside: a press on any of them keeps the overlay open.
	parts: readonly RefObject<Element | null>[]
	onDismiss: (cause: DismissCause) => void
}

// Close an open overlay (a panel, the rail opened over the desk) the way every overlay closes:
// Escape, a press outside its parts, or a resize that would leave a fixed panel where its
// trigger no longer is. The listeners live only while it is open.
export function useDismiss({ isOpen, parts, onDismiss }: DismissOptions): void {
	// oxlint-disable-next-line nextnode/no-use-effect -- document listeners while the overlay is open: browser events the render does not own
	useEffect(() => {
		if (!isOpen) return undefined
		const onKey = (event: KeyboardEvent): void => {
			if (event.key === 'Escape') onDismiss('escape')
		}
		const onPress = (event: PointerEvent): void => {
			const target = event.target instanceof Node ? event.target : null
			const isInside = parts.some(
				part => part.current?.contains(target) === true,
			)
			if (!isInside) onDismiss('outside')
		}
		const onResize = (): void => onDismiss('resize')
		document.addEventListener('keydown', onKey)
		document.addEventListener('pointerdown', onPress)
		window.addEventListener('resize', onResize)
		return (): void => {
			document.removeEventListener('keydown', onKey)
			document.removeEventListener('pointerdown', onPress)
			window.removeEventListener('resize', onResize)
		}
	}, [isOpen, parts, onDismiss])
}

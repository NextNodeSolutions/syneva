import { useEffect } from 'react'

import { isDialogOpen } from './page-keys'

import type { RefObject } from 'react'

export type DismissCause = 'escape' | 'outside' | 'resize'

type DismissOptions = {
	isOpen: boolean
	// What counts as inside: a press on any of them keeps the overlay open.
	parts: readonly RefObject<Element | null>[]
	onDismiss: (cause: DismissCause) => void
}

// Close an open overlay (a panel, the rail opened over the desk) the way every overlay closes:
// Escape, a press outside its parts, focus moving outside them (Tab past its end, a dialog
// opening over it), or a resize that would leave a panel where its trigger no longer is. The
// listeners live only while it is open. Escape is the overlay's alone: it is taken before the
// page's own key handlers see it (a desk's Escape would close its layer too), and left to a
// modal dialog open over the overlay, which closes first.
export function useDismiss({ isOpen, parts, onDismiss }: DismissOptions): void {
	// oxlint-disable-next-line nextnode/no-use-effect -- document listeners while the overlay is open: browser events the render does not own
	useEffect(() => {
		if (!isOpen) return undefined
		const onKey = (event: KeyboardEvent): void => {
			if (event.key !== 'Escape' || isDialogOpen()) return
			event.stopPropagation()
			onDismiss('escape')
		}
		// A press or a focus landing outside every part.
		const onOutside = (event: Event): void => {
			const target = event.target instanceof Node ? event.target : null
			const isInside = parts.some(
				part => part.current?.contains(target) === true,
			)
			if (!isInside) onDismiss('outside')
		}
		const onResize = (): void => onDismiss('resize')
		document.addEventListener('keydown', onKey, { capture: true })
		document.addEventListener('pointerdown', onOutside)
		document.addEventListener('focusin', onOutside)
		window.addEventListener('resize', onResize)
		return (): void => {
			document.removeEventListener('keydown', onKey, { capture: true })
			document.removeEventListener('pointerdown', onOutside)
			document.removeEventListener('focusin', onOutside)
			window.removeEventListener('resize', onResize)
		}
	}, [isOpen, parts, onDismiss])
}

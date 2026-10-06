import { useEffect } from 'react'

import { isPageShortcut } from '@shared/lib/page-keys'

// A bare N, pressed once, outside anything that takes typing, and with no dialog open.
const NEW_REVIEW_KEYS = ['n', 'N']

export function useNewReviewShortcut({
	open,
	isQuiet,
}: {
	open: (() => void) | null
	isQuiet: boolean
}): void {
	useEffect(() => {
		if (!open || isQuiet) return undefined
		const onKeyDown = (event: KeyboardEvent): void => {
			if (!isPageShortcut(event, NEW_REVIEW_KEYS)) return
			event.preventDefault()
			open()
		}
		document.addEventListener('keydown', onKeyDown)
		return () => document.removeEventListener('keydown', onKeyDown)
	}, [open, isQuiet])
}

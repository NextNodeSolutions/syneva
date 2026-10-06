import { useEffect } from 'react'

import { isPageShortcut } from '@shared/lib/page-keys'

// A bare N, pressed once, outside anything that takes typing, and with no dialog open.
const NEW_REVIEW_KEYS = ['n', 'N']

// N opens New review from anywhere on the page; `open` is null while the page offers no New
// review (a signed-out browser), and N stays quiet while `isQuiet` (a close is armed: the
// reviewer is mid-decision, and a dialog over Keep would leave focus nowhere to return to). A
// document listener is an external subscription: the effect adds it and takes it away. `open`
// must keep its identity across renders, or the listener is swapped on every one.
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

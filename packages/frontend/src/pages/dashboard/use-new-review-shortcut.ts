import { useEffect } from 'react'

// Elements whose own typing a bare N belongs to.
const TYPING_TARGETS =
	'input, textarea, select, [contenteditable]:not([contenteditable="false"])'

// A bare N, pressed once, outside anything that takes typing, and with no dialog open.
function isNewReviewKey(event: KeyboardEvent): boolean {
	if (event.key !== 'n' && event.key !== 'N') return false
	if (event.metaKey || event.ctrlKey || event.altKey || event.repeat)
		return false
	const { target } = event
	if (target instanceof Element && target.closest(TYPING_TARGETS))
		return false
	return !document.querySelector('dialog[open]')
}

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
			if (!isNewReviewKey(event)) return
			event.preventDefault()
			open()
		}
		document.addEventListener('keydown', onKeyDown)
		return () => document.removeEventListener('keydown', onKeyDown)
	}, [open, isQuiet])
}

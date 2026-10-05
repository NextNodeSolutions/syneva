import { useEffect } from 'react'

// Escape outside a dialog: the dialog's own Escape cancels it instead.
function isDisarmKey(event: KeyboardEvent): boolean {
	return event.key === 'Escape' && !document.querySelector('dialog[open]')
}

// While a close is armed, Escape disarms it from anywhere on the page - not only from inside
// the armed pair: a click on bare page leaves the close armed with focus on the body, and the
// listing's order held. A document listener is an external subscription: the effect adds it
// while `armedId` names a desk and takes it away after.
export function useEscapeToDisarm(
	armedId: string | null,
	disarm: (deskId: string) => void,
): void {
	useEffect(() => {
		if (armedId === null) return undefined
		const onKeyDown = (event: KeyboardEvent): void => {
			if (isDisarmKey(event)) disarm(armedId)
		}
		document.addEventListener('keydown', onKeyDown)
		return () => document.removeEventListener('keydown', onKeyDown)
	}, [armedId, disarm])
}

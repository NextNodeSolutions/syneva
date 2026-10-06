import { useEffect } from 'react'

import { isDialogOpen } from '@shared/lib/page-keys'

// Escape outside a dialog: the dialog's own Escape cancels it instead.
function isDisarmKey(event: KeyboardEvent): boolean {
	return event.key === 'Escape' && !isDialogOpen()
}

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

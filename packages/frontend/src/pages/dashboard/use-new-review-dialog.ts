import { useCallback, useState } from 'react'

import type { HubPhase } from './hub-phase'

export type NewReviewDialog = {
	// How the page offers New review, or null when it offers none: a signed-out browser can
	// open nothing (the open would only meet the 401), so neither the header's action nor N is
	// there for it.
	offer: (() => void) | null
	isOpen: boolean
	open: () => void
	close: () => void
}

// New review's dialog, opened from the header, the empty band or the N key.
export function useNewReviewDialog(phase: HubPhase): NewReviewDialog {
	const [isOpen, setOpen] = useState(false)
	// Stable, so the N shortcut's listener is not swapped on every render.
	const open = useCallback(() => setOpen(true), [setOpen])
	const isOffered = phase.kind !== 'signed-out'
	return {
		offer: isOffered ? open : null,
		isOpen,
		open,
		close: () => setOpen(false),
	}
}

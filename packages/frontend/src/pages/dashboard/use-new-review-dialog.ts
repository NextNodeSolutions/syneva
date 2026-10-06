import { useCallback, useState } from 'react'

import type { HubPhase } from './hub-phase'

export type NewReviewDialog = {
	// How the page offers New review, or null when it offers none: a signed-out browser can
	// open nothing (the open would only meet the 401), so neither the header's action nor N is
	// there for it.
	offer: (() => void) | null
	// New review on a repository the page already names (a closed desk's), null with `offer`.
	offerIn: ((root: string) => void) | null
	isOpen: boolean
	// The repository the dialog opened on, null when it opened blank.
	seed: string | null
	open: () => void
	close: () => void
}

// New review's dialog, opened from the sidebar, the empty overview or the N key: blank, or on
// a repository the page names.
export function useNewReviewDialog(phase: HubPhase): NewReviewDialog {
	const [opened, setOpened] = useState<{ seed: string | null } | null>(null)
	// Stable, so the N shortcut's listener is not swapped on every render. Neither takes an
	// argument from its caller's event: the sidebar's entry hands its click to `open`.
	const open = useCallback(() => setOpened({ seed: null }), [])
	const openIn = useCallback((root: string) => setOpened({ seed: root }), [])
	const isOffered = phase.kind !== 'signed-out'
	return {
		offer: isOffered ? open : null,
		offerIn: isOffered ? openIn : null,
		isOpen: opened !== null,
		seed: opened?.seed ?? null,
		open,
		close: () => setOpened(null),
	}
}

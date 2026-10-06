import { useCallback, useState } from 'react'

import type { HubPhase } from './hub-phase'

export type NewReviewDialog = {
	offer: (() => void) | null
	// New review on a repository the page already names (a closed desk's), null with `offer`.
	offerIn: ((root: string) => void) | null
	isOpen: boolean
	// The repository the dialog opened on, null when it opened blank.
	seed: string | null
	close: () => void
}

// New review's dialog, opened from the sidebar, the empty overview or the N key: blank, or seeded on a repository the page names.
export function useNewReviewDialog(phase: HubPhase): NewReviewDialog {
	const [opened, setOpened] = useState<{ seed: string | null } | null>(null)
	// Stable, so the N shortcut's listener is not swapped on every render; neither takes an argument from its caller's event.
	const open = useCallback(() => setOpened({ seed: null }), [])
	const openIn = useCallback((root: string) => setOpened({ seed: root }), [])
	const isOffered = phase.kind !== 'signed-out'
	return {
		offer: isOffered ? open : null,
		offerIn: isOffered ? openIn : null,
		isOpen: opened !== null,
		seed: opened?.seed ?? null,
		close: () => setOpened(null),
	}
}

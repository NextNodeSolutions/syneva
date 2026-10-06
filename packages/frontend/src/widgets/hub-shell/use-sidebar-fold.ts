import { useCallback, useState } from 'react'

import { readStored, writeStored } from '@shared/lib/browser-storage'
import { queries } from '@syneva/design-system/media.stylex'

// The sidebar folded to its rail or open, as the reviewer last left it on this browser (a
// per-viewer convenience, so browser storage: a private window or blocked storage only loses
// the memory). A browser with no choice yet opens it on a wide screen and folds it from
// tablets down, where the page needs the width.
const STORAGE_KEY = 'syneva.hub.sidebar'
const FOLDED = 'folded'
const OPEN = 'open'

function remembered(): boolean | null {
	const kept = readStored(STORAGE_KEY)
	if (kept === FOLDED) return true
	if (kept === OPEN) return false
	return null
}

export type SidebarFold = { isFolded: boolean; toggle: () => void }

export function useSidebarFold(): SidebarFold {
	const [isFolded, setFolded] = useState(
		() => remembered() ?? window.matchMedia(queries.tablet).matches,
	)
	const toggle = useCallback(() => {
		setFolded(was => {
			writeStored(STORAGE_KEY, was ? OPEN : FOLDED)
			return !was
		})
	}, [])
	return { isFolded, toggle }
}

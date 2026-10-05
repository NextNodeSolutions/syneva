import { useEffect } from 'react'

import type { HubStatus } from './use-hub'

const PAGE_TITLE = 'Syneva hub'

// The tab's title, for a reviewer who left the tab: the hub's trouble first (a signed-out
// browser sees no listing; a hub that does not answer has a stale one), then how many desks
// wait on them.
function documentTitle(status: HubStatus, yours: number): string {
	if (status === 'signed-out') return `Signed out · ${PAGE_TITLE}`
	if (status === 'unreachable') return `Not answering · ${PAGE_TITLE}`
	if (yours > 0) return `(${yours}) ${PAGE_TITLE}`
	return PAGE_TITLE
}

// The document title is outside React's tree: an effect keeps it in step.
export function useDocumentTitle(status: HubStatus, yours: number): void {
	const title = documentTitle(status, yours)
	useEffect(() => {
		document.title = title
	}, [title])
}

import { useEffect } from 'react'

import { HUB_STATE } from '@widgets/hub-shell/hub-state'

import type { HubStatus } from '@entities/hub/link'

const PAGE_TITLE = 'Syneva hub'

// A hub that does not stream to this page says why in the tab's title, in the shell's words.
function documentTitle(status: HubStatus, yours: number): string {
	if (status !== 'live' && status !== 'connecting')
		return `${HUB_STATE[status].word} · ${PAGE_TITLE}`
	if (yours > 0) return `(${yours}) ${PAGE_TITLE}`
	return PAGE_TITLE
}

export function useDocumentTitle(status: HubStatus, yours: number): void {
	const title = documentTitle(status, yours)
	useEffect(() => {
		document.title = title
	}, [title])
}

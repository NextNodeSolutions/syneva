import { useEffect } from 'react'

import type { HubStatus } from '@entities/hub/use-hub'

const PAGE_TITLE = 'Syneva hub'

function documentTitle(status: HubStatus, yours: number): string {
	if (status === 'signed-out') return `Signed out · ${PAGE_TITLE}`
	if (status === 'unreachable') return `Not answering · ${PAGE_TITLE}`
	if (yours > 0) return `(${yours}) ${PAGE_TITLE}`
	return PAGE_TITLE
}

export function useDocumentTitle(status: HubStatus, yours: number): void {
	const title = documentTitle(status, yours)
	useEffect(() => {
		document.title = title
	}, [title])
}

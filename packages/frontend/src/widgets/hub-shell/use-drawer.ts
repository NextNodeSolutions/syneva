import { useCallback, useMemo, useRef, useState } from 'react'

import { useDismiss } from '@shared/lib/use-dismiss'

import type { DismissCause } from '@shared/lib/use-dismiss'
import type { RefObject } from 'react'

export type Drawer = {
	isOpen: boolean
	open: () => void
	close: () => void
	sidebarRef: RefObject<HTMLDivElement | null>
	menuRef: RefObject<HTMLButtonElement | null>
}

// The phone's drawer: open on the page it was opened from (any navigation closes it, the page
// it opened being the answer), and closed the way every overlay closes: Escape (focus back on
// the menu), a press outside it, a resize.
export function useDrawer(pathname: string): Drawer {
	const [openAt, setOpenAt] = useState<string | null>(null)
	const sidebarRef = useRef<HTMLDivElement>(null)
	const menuRef = useRef<HTMLButtonElement>(null)
	const isOpen = openAt === pathname
	const close = useCallback(() => setOpenAt(null), [])
	const parts = useMemo(() => [sidebarRef, menuRef], [])
	const dismiss = useCallback(
		(cause: DismissCause) => {
			close()
			if (cause === 'escape') menuRef.current?.focus()
		},
		[close],
	)
	useDismiss({ isOpen, parts, onDismiss: dismiss })
	return {
		isOpen,
		open: () => setOpenAt(pathname),
		close,
		sidebarRef,
		menuRef,
	}
}

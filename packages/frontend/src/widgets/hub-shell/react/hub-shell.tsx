import { useRef, useState } from 'react'

import { useEntrance } from '@shared/lib/use-entrance'
import * as stylex from '@stylexjs/stylex'

import { useShellKeys } from '../use-shell-keys'
import { useSidebarFold } from '../use-sidebar-fold'

import { hubShell } from './hub-shell.styles'
import { HubSidebar } from './hub-sidebar'
import { ShellBar } from './shell-bar'
import { ShellDrawer } from './shell-drawer'

import type { ReactElement, ReactNode } from 'react'
import type { NewReviewOffer, SidebarModel } from './hub-sidebar'

export const HUB_MAIN_ID = 'hub-main'

// The dashboard's application frame: the sidebar (folded to its rail as the reviewer left it,
// [ to switch), the page beside it, and on phones a bar with the menu that slides the sidebar
// in as a drawer. The sidebar's entries step in once, when the hub is opened; a move between
// pages keeps it still. The drawer closes on any navigation (the page it opened is the answer).
export function HubShell({
	model,
	newReview,
	children,
}: {
	model: SidebarModel
	newReview: NewReviewOffer | null
	children: ReactNode
}): ReactElement {
	const fold = useSidebarFold()
	const [drawerAt, setDrawerAt] = useState<string | null>(null)
	const isDrawerOpen = drawerAt === model.pathname
	const sidebarRef = useRef<HTMLDivElement>(null)
	useEntrance(sidebarRef, 'shell')
	useShellKeys(fold.toggle)
	return (
		<div
			{...stylex.props(
				hubShell.frame,
				fold.isFolded && hubShell.frameFolded,
			)}
		>
			<ShellBar
				isDrawerOpen={isDrawerOpen}
				onMenu={() => setDrawerAt(model.pathname)}
			/>
			<ShellDrawer
				sidebarRef={sidebarRef}
				isOpen={isDrawerOpen}
				onClose={() => setDrawerAt(null)}
			>
				<HubSidebar
					model={model}
					fold={isDrawerOpen ? { ...fold, isFolded: false } : fold}
					newReview={newReview}
				/>
			</ShellDrawer>
			<main
				id={HUB_MAIN_ID}
				tabIndex={-1}
				{...stylex.props(hubShell.main)}
			>
				{children}
			</main>
		</div>
	)
}

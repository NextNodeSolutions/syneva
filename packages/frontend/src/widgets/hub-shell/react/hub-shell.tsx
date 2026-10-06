import { setPageScroller } from '@shared/lib/router'
import { useEntrance } from '@shared/lib/use-entrance'
import { useMediaQuery } from '@shared/lib/use-media-query'
import * as stylex from '@stylexjs/stylex'
import { queries } from '@syneva/design-system/media.stylex'

import { useDrawer } from '../use-drawer'
import { useShellKeys } from '../use-shell-keys'
import { useSidebarFold } from '../use-sidebar-fold'

import { hubShell } from './hub-shell.styles'
import { HubSidebar } from './hub-sidebar'
import { RailTip } from './rail-tip'
import { ShellBar } from './shell-bar'
import { ShellDrawer } from './shell-drawer'
import { foldedShell } from './shell-edge.stylex'

import type { ReactElement, ReactNode } from 'react'
import type { NewReviewOffer, SidebarModel } from './hub-sidebar'

export const HUB_MAIN_ID = 'hub-main'

// The dashboard's application frame: the sidebar (folded to its rail as the reviewer left it,
// [ to switch), the page beside it, and on phones a bar with the menu that slides the sidebar
// in as a drawer (never folded there: the drawer is the sidebar's whole width). The sidebar's
// entries step in once, when the hub is opened; a move between pages keeps it still.
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
	const { isOpen, open, close, sidebarRef, menuRef } = useDrawer(
		model.pathname,
	)
	const isStacked = useMediaQuery(queries.stacked)
	useEntrance(sidebarRef, 'shell')
	useShellKeys(fold.toggle)
	const isFolded = fold.isFolded && !isStacked
	return (
		<div
			data-drawer-open={isOpen || undefined}
			{...stylex.props(
				hubShell.frame,
				isFolded && [hubShell.frameFolded, foldedShell],
			)}
		>
			<ShellBar menuRef={menuRef} isDrawerOpen={isOpen} onMenu={open} />
			<ShellDrawer
				sidebarRef={sidebarRef}
				isOpen={isOpen}
				isStacked={isStacked}
				onClose={close}
			>
				<HubSidebar
					model={model}
					fold={{ ...fold, isFolded }}
					newReview={newReview}
				/>
			</ShellDrawer>
			<RailTip scope={sidebarRef} />
			<main
				ref={setPageScroller}
				id={HUB_MAIN_ID}
				tabIndex={-1}
				{...stylex.props(hubShell.main)}
			>
				{children}
			</main>
		</div>
	)
}

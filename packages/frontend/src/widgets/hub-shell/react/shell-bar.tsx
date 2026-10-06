import { Button } from '@shared/ui/button'
import * as stylex from '@stylexjs/stylex'

import { hubShell } from './hub-shell.styles'
import { ShellIcon } from './shell-icon'
import { SidebarBrand } from './sidebar-brand'
import { sidebarParts } from './sidebar-parts.styles'

import type { ReactElement, RefObject } from 'react'

// The phone's bar over the page: the menu that slides the sidebar in, and the wordmark home.
export function ShellBar({
	menuRef,
	isDrawerOpen,
	onMenu,
}: {
	menuRef: RefObject<HTMLButtonElement | null>
	isDrawerOpen: boolean
	onMenu: () => void
}): ReactElement {
	return (
		<header {...stylex.props(hubShell.bar)}>
			<Button
				ref={menuRef}
				tone="quiet"
				css={sidebarParts.foldButton}
				aria-label="Open navigation"
				aria-expanded={isDrawerOpen}
				onClick={onMenu}
			>
				<ShellIcon name="menu" />
			</Button>
			<SidebarBrand isFolded={false} />
		</header>
	)
}

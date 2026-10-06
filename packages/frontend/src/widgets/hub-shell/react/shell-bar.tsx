import * as stylex from '@stylexjs/stylex'
import { control } from '@syneva/design-system/controls.styles'
import { press } from '@syneva/design-system/press.styles'

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
			<button
				ref={menuRef}
				type="button"
				aria-label="Open navigation"
				aria-expanded={isDrawerOpen}
				onClick={onMenu}
				{...stylex.props(
					press.control,
					control.base,
					control.quiet,
					sidebarParts.foldButton,
				)}
			>
				<ShellIcon name="menu" />
			</button>
			<SidebarBrand isFolded={false} />
		</header>
	)
}

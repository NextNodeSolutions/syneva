import * as stylex from '@stylexjs/stylex'

import { hubShell } from './hub-shell.styles'

import type { MouseEvent, ReactElement, ReactNode, RefObject } from 'react'

// The sidebar's column: in the grid on wide screens, a drawer over a paper veil on phones (a
// tap on the veil closes it). Closed on a phone, it is out of reach (inert): its links stay
// off the keyboard's path while it waits off screen. A link followed from it closes it, one to
// the page already shown included (that one moves nowhere, so no navigation would).
export function ShellDrawer({
	sidebarRef,
	isOpen,
	isStacked,
	onClose,
	children,
}: {
	sidebarRef: RefObject<HTMLDivElement | null>
	isOpen: boolean
	isStacked: boolean
	onClose: () => void
	children: ReactNode
}): ReactElement {
	const closeOnLink = (event: MouseEvent<HTMLElement>): void => {
		if (event.target instanceof Element && event.target.closest('a[href]'))
			onClose()
	}
	return (
		<>
			<div
				ref={sidebarRef}
				inert={isStacked && !isOpen}
				onClick={closeOnLink}
				{...stylex.props(
					hubShell.sidebar,
					isOpen && hubShell.sidebarOpen,
				)}
			>
				{children}
			</div>
			<div
				{...stylex.props(hubShell.veil, isOpen && hubShell.veilOpen)}
				onClick={onClose}
				aria-hidden="true"
			/>
		</>
	)
}

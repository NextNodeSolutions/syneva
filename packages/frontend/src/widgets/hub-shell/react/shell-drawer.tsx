import * as stylex from '@stylexjs/stylex'

import { hubShell } from './hub-shell.styles'

import type { ReactElement, ReactNode, RefObject } from 'react'

// The sidebar's column: in the grid on wide screens, a drawer over a paper veil on phones (a
// tap on the veil closes it).
export function ShellDrawer({
	sidebarRef,
	isOpen,
	onClose,
	children,
}: {
	sidebarRef: RefObject<HTMLDivElement | null>
	isOpen: boolean
	onClose: () => void
	children: ReactNode
}): ReactElement {
	return (
		<>
			<div
				ref={sidebarRef}
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

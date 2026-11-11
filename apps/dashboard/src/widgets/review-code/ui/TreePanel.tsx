import * as stylex from '@stylexjs/stylex'

import { treePanel } from './tree-panel.styles'

import type { ReactElement, ReactNode } from 'react'

type TreePanelProps = {
	isDrawerOpen: boolean
	onDrawerClose: () => void
	children: ReactNode
}

export function TreePanel({
	isDrawerOpen,
	onDrawerClose,
	children,
}: TreePanelProps): ReactElement {
	return (
		<>
			<nav
				aria-label="Changed files"
				{...stylex.props(
					treePanel.panel,
					isDrawerOpen && treePanel.open,
				)}
			>
				{children}
			</nav>
			{isDrawerOpen && (
				<button
					type="button"
					tabIndex={-1}
					aria-label="Close the file tree"
					onClick={onDrawerClose}
					{...stylex.props(treePanel.veil)}
				/>
			)}
		</>
	)
}

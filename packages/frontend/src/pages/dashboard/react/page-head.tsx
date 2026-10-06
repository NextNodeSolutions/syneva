import * as stylex from '@stylexjs/stylex'

import { pageHead } from './page-head.styles'

import type { ReactElement, ReactNode } from 'react'

// A page's head: its statement (the one h1, never a live region: a poll must not announce it
// again), the line under it, and the page's controls. `isPending` marks a statement still
// waiting on the hub.
export function PageHead({
	title,
	lede,
	isPending = false,
	children,
}: {
	title: string
	lede?: ReactNode
	isPending?: boolean | undefined
	children?: ReactNode
}): ReactElement {
	return (
		<header {...stylex.props(pageHead.root)}>
			<div {...stylex.props(pageHead.statement)} data-enter="rise">
				<h1
					{...stylex.props(
						pageHead.title,
						isPending && pageHead.pending,
					)}
				>
					{title}
				</h1>
				{lede && <p {...stylex.props(pageHead.lede)}>{lede}</p>}
			</div>
			{children && (
				<div {...stylex.props(pageHead.actions)} data-enter="fade">
					{children}
				</div>
			)}
		</header>
	)
}

import * as stylex from '@stylexjs/stylex'

import type { Style } from '@shared/lib/cx'
import type { ReactElement, ReactNode } from 'react'
import type { ListHold } from '../use-list-hold'

// The element a listing's order holds still under: the pointer in it or keyboard focus in it
// (use-list-hold.ts) keeps its rows where they are.
export function HoldList({
	hold,
	css,
	children,
}: {
	hold: ListHold
	css: Style
	children: ReactNode
}): ReactElement {
	const { bind, listeners } = hold
	return (
		<div ref={bind} {...listeners} {...stylex.props(css)}>
			{children}
		</div>
	)
}

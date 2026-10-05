import * as stylex from '@stylexjs/stylex'

import { DESKS_ID } from '../focus-targets'

import { dashboard } from './dashboard.styles'

import type { ReactElement, ReactNode } from 'react'
import type { ListHold } from '../use-list-hold'

// The listing's landmark: the skip link's target (focusable, never ringed), and the surface
// whose pointer and focus hold the rows' order still. Empty, it sets the wash band in it on
// the footer's rule.
export function HubMain({
	bind,
	listeners,
	isEmpty,
	children,
}: Pick<ListHold, 'bind' | 'listeners'> & {
	isEmpty: boolean
	children: ReactNode
}): ReactElement {
	return (
		<main
			ref={bind}
			id={DESKS_ID}
			tabIndex={-1}
			{...stylex.props(dashboard.main, isEmpty && dashboard.mainEmpty)}
			{...listeners}
		>
			{children}
		</main>
	)
}

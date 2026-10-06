import * as stylex from '@stylexjs/stylex'

import { popover } from './popover.styles'

import type { ReactElement, ReactNode, RefObject } from 'react'

export type Placement = { top: number; left: number }

// The open panel of a Popover, at the place measured from its trigger.
export function PopoverPanel({
	id,
	label,
	place,
	panelRef,
	children,
}: {
	id: string
	label: string
	place: Placement
	panelRef: RefObject<HTMLDivElement | null>
	children: ReactNode
}): ReactElement {
	return (
		<div
			ref={panelRef}
			id={id}
			role="group"
			aria-label={label}
			{...stylex.props(popover.panel, popover.at(place.top, place.left))}
		>
			{children}
		</div>
	)
}

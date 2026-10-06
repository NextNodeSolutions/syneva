import { useCountUp } from '@shared/lib/use-count-up'
import { sectionLabel } from '@shared/ui/section-label.styles'
import * as stylex from '@stylexjs/stylex'

import { cockpit } from './cockpit.styles'

import type { ReactElement } from 'react'

export type StatFigure = { figure: number; unit?: string | undefined } | null

// One of the cockpit's numbers: what it counts, the figure (ticking up when the cockpit opens
// and whenever it changes), and a line on how to read it. A figure there is nothing to count
// for yet says so instead of showing a zero.
export function StatTile({
	label,
	stat,
	sub,
	isYours = false,
}: {
	label: string
	stat: StatFigure
	sub: string
	isYours?: boolean
}): ReactElement {
	const shown = useCountUp(stat?.figure ?? 0, { isFromZero: true })
	return (
		<div
			data-enter="rise"
			{...stylex.props(cockpit.tile, isYours && cockpit.tileYours)}
		>
			<p {...stylex.props(sectionLabel.base)}>{label}</p>
			{stat ? (
				<p {...stylex.props(cockpit.figure)}>
					{shown}
					{stat.unit && (
						<span {...stylex.props(cockpit.unit)}>{stat.unit}</span>
					)}
				</p>
			) : (
				<p {...stylex.props(cockpit.figure, cockpit.figureNone)}>
					Not yet
				</p>
			)}
			<p {...stylex.props(cockpit.sub)}>{sub}</p>
		</div>
	)
}

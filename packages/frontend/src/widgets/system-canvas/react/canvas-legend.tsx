import { CHANGE_WORDS } from '@shared/ui/change-mark.styles'
import * as stylex from '@stylexjs/stylex'

import { legend } from './legend.styles'

import type { ChangeMark } from '@entities/review/guide/model'
import type { ReactElement } from 'react'
import type { Projection } from '../model'

// Each projection says in one line what it is for: the map to find the way in, the tiers to see where in the architecture the change sits, the two floors to see what it does to the system as a whole.
export const PURPOSES: Record<Projection, { name: string; line: string }> = {
	plan: {
		name: 'Map',
		line: 'Every part inside the system that holds it. Point at one to trace its links; a number opens its domain.',
	},
	iso: {
		name: 'Tiers',
		line: 'Each part on the floor of its tier, the interface over the services over the data; a change raises its part.',
	},
	orbit: {
		name: 'Before → after',
		line: 'The system after the change over the system before it; look under the top floor to see what was there.',
	},
}

const MARKS: ChangeMark[] = ['added', 'changed', 'removed']

// The projection's purpose, then the change marks it paints (the one strong colour) and the domain number that leads down to the code.
export function CanvasLegend({
	projection,
}: {
	projection: Projection
}): ReactElement {
	const purpose = PURPOSES[projection]
	return (
		<p {...stylex.props(legend.line)}>
			<span {...stylex.props(legend.name)}>{purpose.name}</span>
			<span {...stylex.props(legend.text)}>{purpose.line}</span>
			<span {...stylex.props(legend.keys)} aria-hidden="true">
				{MARKS.map(mark => (
					<span key={mark} {...stylex.props(legend.key)}>
						<span {...stylex.props(legend.swatch, legend[mark])} />
						{CHANGE_WORDS[mark]}
					</span>
				))}
				<span {...stylex.props(legend.key)}>
					<span {...stylex.props(legend.number)}>1</span>
					domain
				</span>
			</span>
		</p>
	)
}

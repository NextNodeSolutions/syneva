import { CHANGE_WORDS } from '@shared/ui/change-mark.styles'
import * as stylex from '@stylexjs/stylex'

import { legend } from './legend.styles'

import type { ChangeMark } from '@entities/review/guide/model'
import type { ReactElement } from 'react'
import type { Projection } from '../model'

export const PURPOSES: Record<
	Projection,
	{ tab: string; name: string; line: string }
> = {
	plan: {
		tab: '2D · Flow',
		name: 'Follow the flow',
		line: 'Choose a path to walk through one behavior. Select a part to read its role and the explanation behind its change.',
	},
	iso: {
		tab: 'Iso · Layers',
		name: 'Place the change',
		line: "Interface, services and data sit on separate layers, inferred from each part's kind. Select a part to read its role and open its explanation.",
	},
	orbit: {
		tab: '3D · Changes',
		name: 'Compare structure',
		line: 'After is above Before. New parts exist only after, removed parts only before. A changed part can keep its position. Its explanation says what behaves differently.',
	},
}

const MARKS: ChangeMark[] = ['added', 'changed', 'removed']

export function CanvasLegend(): ReactElement {
	return (
		<p {...stylex.props(legend.line)} aria-label="Change marks">
			<span {...stylex.props(legend.text)}>
				Select a part to read its explanation.
			</span>
			<span {...stylex.props(legend.keys)}>
				{MARKS.map(mark => (
					<span key={mark} {...stylex.props(legend.key)}>
						<span {...stylex.props(legend.swatch, legend[mark])} />
						{CHANGE_WORDS[mark]}
					</span>
				))}
				<span {...stylex.props(legend.key)}>
					<span {...stylex.props(legend.number)}>1</span>
					explanation
				</span>
			</span>
		</p>
	)
}

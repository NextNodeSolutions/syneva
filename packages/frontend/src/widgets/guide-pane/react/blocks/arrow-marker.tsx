import * as stylex from '@stylexjs/stylex'

import { diagram } from './diagram.styles'

import type { ReactElement } from 'react'

const ARROW_ID = 'guide-arrow'

export const ARROW_END = `url(#${ARROW_ID})`

// The one arrowhead every diagram's edges end on.
export function ArrowMarker(): ReactElement {
	return (
		<defs>
			<marker
				id={ARROW_ID}
				viewBox="0 0 10 10"
				refX="9"
				refY="5"
				markerWidth="7"
				markerHeight="7"
				orient="auto-start-reverse"
			>
				<path d="M0 0L10 5L0 10z" {...stylex.props(diagram.marker)} />
			</marker>
		</defs>
	)
}

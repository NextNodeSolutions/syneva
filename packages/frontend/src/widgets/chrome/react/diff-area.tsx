import * as stylex from '@stylexjs/stylex'

import { diffArea } from './diff-area.styles'

import type { ReactElement } from 'react'

// The code's area: the diff scroller the render funnel paints into and its overview ruler. The file's sign-off lives on the name bar pinned at the scroller's top (file-header.ts), so nothing floats over the code. Hidden, it keeps its DOM (the scroller is reached by id) and only leaves the layout.
export function DiffArea({ hidden }: { hidden: boolean }): ReactElement {
	return (
		<div
			{...stylex.props(diffArea.area, hidden && diffArea.hidden)}
			data-morph="code"
		>
			<div id="diff" {...stylex.props(diffArea.scroller)} />
			<div id="ovr" hidden {...stylex.props(diffArea.ruler)} />
		</div>
	)
}

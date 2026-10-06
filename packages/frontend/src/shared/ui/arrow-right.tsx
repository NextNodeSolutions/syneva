import * as stylex from '@stylexjs/stylex'
import { ARROW_PATH, ARROW_VIEW_BOX } from '@syneva/design-system/icons'

import { arrowRight } from './arrow-right.styles'

import type { Style } from '@shared/lib/cx'
import type { ReactElement } from 'react'

export function ArrowRight({ css }: { css: Style }): ReactElement {
	return (
		<svg
			{...stylex.props(arrowRight.base, css)}
			viewBox={ARROW_VIEW_BOX}
			aria-hidden="true"
		>
			<path d={ARROW_PATH} />
		</svg>
	)
}

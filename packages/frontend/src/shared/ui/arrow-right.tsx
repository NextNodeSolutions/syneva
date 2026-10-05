import * as stylex from '@stylexjs/stylex'
import { ARROW_PATH, ARROW_VIEW_BOX } from '@syneva/design-system/icons'

import { arrowRight } from './arrow-right.styles'

import type { Style } from '@shared/lib/cx'
import type { ReactElement } from 'react'

// The arrow that closes a primary action and leads a row somewhere. The
// caller sizes it (14px beside a small label, 16px beside a base or large
// one, 20px at the end of a row) and moves it on hover.
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

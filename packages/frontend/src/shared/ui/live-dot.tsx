import * as stylex from '@stylexjs/stylex'
import { dot } from '@syneva/design-system/controls.styles'

import type { Style } from '@shared/lib/cx'
import type { StyleXStyles } from '@stylexjs/stylex'
import type { ReactElement } from 'react'

export type DotTone =
	| 'neutral'
	| 'signal'
	| 'petrol'
	| 'green'
	| 'amber'
	| 'red'

const TONE_STYLE: Record<DotTone, StyleXStyles> = {
	neutral: null,
	signal: dot.accent,
	petrol: dot.petrol,
	green: dot.green,
	amber: dot.amber,
	red: dot.red,
}

type LiveDotProps = {
	tone?: DotTone | undefined
	hollow?: boolean | undefined
	live?: boolean | undefined
	css?: Style | undefined
}

export function LiveDot({
	tone = 'neutral',
	hollow,
	live,
	css,
}: LiveDotProps): ReactElement {
	return (
		<span
			{...stylex.props(
				dot.base,
				TONE_STYLE[tone],
				hollow === true && dot.hollow,
				live === true && dot.live,
				css,
			)}
			aria-hidden="true"
		/>
	)
}

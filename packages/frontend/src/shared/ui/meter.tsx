import * as stylex from '@stylexjs/stylex'
import { meter } from '@syneva/design-system/meter.styles'

import { meterShare } from './meter.styles'

import type { ReactElement } from 'react'

// A share of a whole as a thin track. It is hidden from assistive technology:
// the text beside it states the numbers. A whole of nothing (max 0) is the
// recipe's dashed rule, never an empty track that would read as 0%.
export function Meter({
	value = 0,
	max,
}: {
	value?: number | undefined
	max: number
}): ReactElement {
	if (max <= 0)
		return (
			<span
				{...stylex.props(meter.track, meter.empty)}
				aria-hidden="true"
			/>
		)
	const fraction = Math.min(1, Math.max(0, value / max))
	return (
		<span {...stylex.props(meter.track)} aria-hidden="true">
			<span {...stylex.props(meter.fill, meterShare.scale(fraction))} />
		</span>
	)
}

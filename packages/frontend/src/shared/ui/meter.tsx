import * as stylex from '@stylexjs/stylex'
import { meter } from '@syneva/design-system/meter.styles'

import { meterShare } from './meter.styles'

import type { ReactElement } from 'react'

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

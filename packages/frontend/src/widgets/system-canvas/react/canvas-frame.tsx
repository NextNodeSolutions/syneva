import * as stylex from '@stylexjs/stylex'

import { POSE_TILT } from '../projection/before-after'

import { CanvasLegend } from './canvas-legend'
import { CanvasStage } from './canvas-stage'
import { CanvasToolbar } from './canvas-toolbar'
import { reading } from './reading.styles'
import { useOrbit } from './use-orbit'

import type { ModelView } from '@entities/review/guide/system-model'
import type { ReactElement, ReactNode } from 'react'
import type { CanvasScene } from './use-canvas-scene'

export function CanvasFrame({
	views,
	current,
	onFail,
	children,
}: {
	views: readonly ModelView[]
	current: CanvasScene
	onFail: () => void
	children: ReactNode
}): ReactElement {
	const hold = useOrbit(0, POSE_TILT.after)
	return (
		<>
			<CanvasToolbar views={views} current={current} hold={hold} />
			<div {...stylex.props(reading.workspace)}>
				<div {...stylex.props(reading.drawing)}>
					<CanvasStage
						current={current}
						hold={hold}
						onFail={onFail}
					/>
					<CanvasLegend />
				</div>
				{children}
			</div>
		</>
	)
}

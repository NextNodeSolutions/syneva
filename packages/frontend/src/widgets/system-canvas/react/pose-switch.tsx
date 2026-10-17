import { Button } from '@shared/ui/button'
import { deskControl } from '@shared/ui/desk-control.styles'
import { tip } from '@shared/ui/tip.styles'
import * as stylex from '@stylexjs/stylex'

import { POSE_TILT, sideOf } from '../projection/before-after'

import { canvas } from './canvas.styles'

import type { ReactElement } from 'react'
import type { Side } from '../projection/before-after'
import type { OrbitHold } from './use-orbit'

const POSES: { side: Side; title: string; purpose: string }[] = [
	{
		side: 'before',
		title: 'Before',
		purpose: 'Look under the floors: the system before the change',
	},
	{
		side: 'after',
		title: 'After',
		purpose: 'Look over the floors: the system after the change',
	},
]

// The 3D view's one question in the toolbar: which floor the camera reads, the system before (from under the floors) or after (from over them). Choosing one eases the camera there; the pressed one follows the camera, dragged or eased.
export function PoseSwitch({ hold }: { hold: OrbitHold }): ReactElement {
	const side = sideOf(hold.orbit.tilt)
	return (
		<span
			{...stylex.props(canvas.tabs)}
			role="group"
			aria-label="Before or after"
		>
			{POSES.map(pose => (
				<Button
					key={pose.side}
					size="small"
					aria-pressed={pose.side === side}
					data-tip={pose.purpose}
					css={[
						deskControl.mini,
						tip.host,
						tip.end,
						pose.side === side && canvas.tabOn,
					]}
					onClick={() => hold.poseTo(POSE_TILT[pose.side])}
				>
					{pose.title}
				</Button>
			))}
		</span>
	)
}

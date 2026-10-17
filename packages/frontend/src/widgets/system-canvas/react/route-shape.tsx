import { routePath } from '@shared/lib/graph-layout'
import { changeFill, changeStroke } from '@shared/ui/change-mark.styles'
import * as stylex from '@stylexjs/stylex'

import { project } from '../projection/camera'

import { arrowHead } from './arrow-head'
import { useCanvasFocus } from './canvas-focus'
import { link as styles } from './link.styles'
import { solid } from './solid.styles'

import type { Point } from '@shared/lib/graph-layout'
import type { ReactElement } from 'react'
import type { SceneLink } from '../layout/scene'
import type { Camera, Size } from '../projection/camera'
import type { Route } from '../projection/solids'

// A step up a rim projects to a point on top of the one before it in some turns: the arrowhead needs a last leg with a length.
function distinct(points: readonly Point[]): Point[] {
	return points.filter((point, index) => {
		const before = points[index - 1]
		return !before || before.x !== point.x || before.y !== point.y
	})
}

// One link over the ground, in the plan's rules: its route as the camera sees it, its arrowhead at the part it reaches.
export function RouteShape({
	route,
	link,
	camera,
	floor,
}: {
	route: Route
	link: SceneLink
	camera: Camera
	floor: Size
}): ReactElement {
	const focus = useCanvasFocus()
	const tone = focus.linkTone(link)
	const points = distinct(
		route.points.map(point => project(camera, floor, point)),
	)
	const head = arrowHead(points)
	const isStep = Boolean(link.step)
	return (
		<g {...stylex.props(solid.link)}>
			<path
				d={routePath(points)}
				{...stylex.props(
					styles.path,
					isStep && styles.step,
					link.change && changeStroke[link.change],
					tone === 'lit' && styles.lit,
					tone === 'dim' && styles.dim,
				)}
			/>
			{head && (
				<path
					d={head}
					{...stylex.props(
						styles.head,
						isStep && styles.stepHead,
						link.change && changeFill[link.change],
						tone === 'dim' && styles.dim,
					)}
				/>
			)}
		</g>
	)
}

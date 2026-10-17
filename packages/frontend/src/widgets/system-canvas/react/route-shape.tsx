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
import type { RaisedLink, Trace } from '../projection/raised'
import type { View } from './solid-shape'

// A step up a rim or a drop projects to a point on top of the one before it in some turns: the arrowhead needs a last leg with a length.
function distinct(points: readonly Point[]): Point[] {
	return points.filter((point, index) => {
		const before = points[index - 1]
		return !before || before.x !== point.x || before.y !== point.y
	})
}

// One link in the plan's rules: its route as the camera sees it, its arrowhead at the part it reaches, in the change this deck shows on it.
export function RouteShape({
	raised,
	view,
}: {
	raised: RaisedLink
	view: View
}): ReactElement {
	const focus = useCanvasFocus()
	const { link, mark } = raised
	const tone = focus.linkTone(link)
	const points = distinct(
		raised.route.points.map(point =>
			project(view.camera, view.floor, point),
		),
	)
	const head = arrowHead(points)
	const isStep = Boolean(link.step)
	return (
		<g
			{...stylex.props(
				solid.link,
				raised.isQuiet && solid.quiet,
				tone === 'dim' && styles.dim,
			)}
		>
			<path
				d={routePath(points)}
				{...stylex.props(
					styles.path,
					isStep && styles.step,
					mark && changeStroke[mark],
					tone === 'lit' && styles.lit,
				)}
			/>
			{head && (
				<path
					d={head}
					{...stylex.props(
						styles.head,
						isStep && styles.stepHead,
						mark && changeFill[mark],
					)}
				/>
			)}
		</g>
	)
}

// The same part on two decks, joined by a thin dotted rule.
export function TraceShape({
	trace,
	view,
}: {
	trace: Trace
	view: View
}): ReactElement {
	const focus = useCanvasFocus()
	const tone = focus.toneOf(trace.id)
	const from = project(view.camera, view.floor, trace.from)
	const to = project(view.camera, view.floor, trace.to)
	return (
		<path
			d={`M${from.x} ${from.y}L${to.x} ${to.y}`}
			{...stylex.props(
				solid.trace,
				tone === 'lit' && solid.traceLit,
				tone === 'dim' && styles.dim,
			)}
		/>
	)
}

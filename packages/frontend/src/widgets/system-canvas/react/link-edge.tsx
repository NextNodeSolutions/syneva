import { routePath } from '@shared/lib/graph-layout'
import { changeFill, changeStroke } from '@shared/ui/change-mark.styles'
import * as stylex from '@stylexjs/stylex'
import { EdgeLabelRenderer } from '@xyflow/react'

import { linkText } from '../layout/scene'

import { useCanvasFocus } from './canvas-focus'
import { link as styles } from './link.styles'

import type { Point, Rect } from '@shared/lib/graph-layout'
import type { Edge, EdgeProps } from '@xyflow/react'
import type { ReactElement } from 'react'
import type { SceneLink } from '../layout/scene'

export type LinkData = {
	link: SceneLink
	points: Point[]
	label?: Rect | undefined
}
export type LinkFlowEdge = Edge<LinkData, 'link'>

const HEAD_LENGTH = 7
const HEAD_HALF = 3.5
// The last leg runs from the second-to-last point to the tip.
const LEG_START = 2

// The arrowhead at the route's end, pointing along its last leg.
function arrowHead(points: readonly Point[]): string | undefined {
	const tip = points.at(-1)
	const from = points.at(-LEG_START)
	if (!tip || !from) return undefined
	const length = Math.hypot(tip.x - from.x, tip.y - from.y) || 1
	const ux = (tip.x - from.x) / length
	const uy = (tip.y - from.y) / length
	const bx = tip.x - ux * HEAD_LENGTH
	const by = tip.y - uy * HEAD_LENGTH
	return `M${tip.x} ${tip.y}L${bx - uy * HEAD_HALF} ${by + ux * HEAD_HALF}L${bx + uy * HEAD_HALF} ${by - ux * HEAD_HALF}Z`
}

function LinkLabel({
	data,
	tone,
}: {
	data: LinkData
	tone: string
}): ReactElement | null {
	const { label, link } = data
	if (!label) return null
	const text = linkText(link)
	return (
		<EdgeLabelRenderer>
			<div
				title={text}
				{...stylex.props(
					styles.label,
					styles.at(label.x, label.y, label.width, label.height),
					tone === 'lit' && styles.labelLit,
					tone === 'dim' && styles.labelDim,
				)}
			>
				{link.step && (
					<span {...stylex.props(styles.number)}>{link.step}</span>
				)}
				<span {...stylex.props(styles.text)}>{text}</span>
			</div>
		</EdgeLabelRenderer>
	)
}

export function LinkEdge({
	data,
}: EdgeProps<LinkFlowEdge>): ReactElement | null {
	const focus = useCanvasFocus()
	if (!data) return null
	const { link } = data
	const tone = focus.linkTone(link)
	const head = arrowHead(data.points)
	const isStep = Boolean(link.step)
	return (
		<>
			<path
				d={routePath(data.points)}
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
			<LinkLabel data={data} tone={tone} />
		</>
	)
}

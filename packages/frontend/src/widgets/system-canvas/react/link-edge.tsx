import { routePath } from '@shared/lib/graph-layout'
import { changeFill, changeStroke } from '@shared/ui/change-mark.styles'
import * as stylex from '@stylexjs/stylex'
import { EdgeLabelRenderer } from '@xyflow/react'

import { linkText } from '../layout/scene'

import { arrowHead } from './arrow-head'
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

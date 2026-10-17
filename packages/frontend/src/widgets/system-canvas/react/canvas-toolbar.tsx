import { isMotionReduced } from '@shared/lib/motion'
import { Button } from '@shared/ui/button'
import { deskControl } from '@shared/ui/desk-control.styles'
import * as stylex from '@stylexjs/stylex'
import { useReactFlow } from '@xyflow/react'

import { PURPOSES } from './canvas-legend'
import { canvas } from './canvas.styles'
import { ZoomGlyph } from './glyphs'
import { PoseSwitch } from './pose-switch'

import type { ModelView } from '@entities/review/guide/system-model'
import type { ReactElement } from 'react'
import type { Projection } from '../model'
import type { CanvasScene } from './use-canvas-scene'
import type { OrbitHold } from './use-orbit'

const ZOOM_MS = 160
const PROJECTIONS: Projection[] = ['plan', 'iso', 'orbit']
const zoom = (): { duration: number } => ({
	duration: isMotionReduced() ? 0 : ZOOM_MS,
})

function Zoom(): ReactElement {
	const flow = useReactFlow()
	return (
		<span {...stylex.props(canvas.zoom)}>
			<Button
				size="small"
				css={[deskControl.compact, deskControl.iconMini]}
				aria-label="Zoom out"
				onClick={() => void flow.zoomOut(zoom())}
			>
				<ZoomGlyph isIn={false} />
			</Button>
			<Button
				size="small"
				css={[deskControl.compact, deskControl.iconMini]}
				aria-label="Zoom in"
				onClick={() => void flow.zoomIn(zoom())}
			>
				<ZoomGlyph isIn />
			</Button>
			<Button
				size="small"
				css={deskControl.compact}
				onClick={() => void flow.fitView({ ...zoom(), padding: 0.06 })}
			>
				Fit map
			</Button>
		</span>
	)
}

function Projections({
	current,
	hold,
}: {
	current: CanvasScene
	hold: OrbitHold
}): ReactElement {
	return (
		<span
			{...stylex.props(canvas.tabs)}
			role="group"
			aria-label="Projection"
		>
			{PROJECTIONS.map(id => (
				<Button
					key={id}
					size="small"
					aria-pressed={id === current.projection}
					title={PURPOSES[id].line}
					css={[
						deskControl.compact,
						id === current.projection && canvas.tabOn,
					]}
					onClick={() => {
						hold.stop()
						current.onProjection(id)
					}}
				>
					{PURPOSES[id].tab}
				</Button>
			))}
		</span>
	)
}

function Paths({
	views,
	current,
	hold,
}: {
	views: readonly ModelView[]
	current: CanvasScene
	hold: OrbitHold
}): ReactElement | null {
	if (!views.length) return null
	const paths = [{ id: null, title: 'Whole system' }, ...views]
	return (
		<div
			{...stylex.props(canvas.paths)}
			role="group"
			aria-label="Follow a path"
		>
			<span {...stylex.props(canvas.pathLabel)}>Follow a path</span>
			{paths.map(path => (
				<Button
					key={path.id ?? ''}
					size="small"
					aria-pressed={path.id === current.viewId}
					css={[
						deskControl.compact,
						path.id === current.viewId && canvas.tabOn,
					]}
					onClick={() => {
						hold.stop()
						current.onView(path.id)
					}}
				>
					{path.title}
				</Button>
			))}
		</div>
	)
}

export function CanvasToolbar({
	views,
	current,
	hold,
}: {
	views: readonly ModelView[]
	current: CanvasScene
	hold: OrbitHold
}): ReactElement {
	return (
		<>
			<div {...stylex.props(canvas.toolbar)}>
				<Projections current={current} hold={hold} />
				<span {...stylex.props(canvas.end)}>
					{current.projection === 'plan' && <Zoom />}
					{current.projection === 'orbit' && (
						<PoseSwitch hold={hold} />
					)}
				</span>
			</div>
			<Paths views={views} current={current} hold={hold} />
		</>
	)
}

import { Button } from '@shared/ui/button'
import { deskControl } from '@shared/ui/desk-control.styles'
import { tip } from '@shared/ui/tip.styles'
import * as stylex from '@stylexjs/stylex'
import { useReactFlow } from '@xyflow/react'

import { canvas } from './canvas.styles'
import { ZoomGlyph } from './glyphs'
import { PoseSwitch } from './pose-switch'

import type { ModelView } from '@entities/review/guide/system-model'
import type { ReactElement } from 'react'
import type { Projection } from '../model'
import type { CanvasScene } from './use-canvas-scene'
import type { OrbitHold } from './use-orbit'

const ZOOM = { duration: 160 }

function Zoom(): ReactElement {
	const flow = useReactFlow()
	return (
		<span {...stylex.props(canvas.zoom)}>
			<Button
				size="small"
				css={[deskControl.mini, deskControl.iconMini]}
				aria-label="Zoom out"
				onClick={() => void flow.zoomOut(ZOOM)}
			>
				<ZoomGlyph isIn={false} />
			</Button>
			<Button
				size="small"
				css={[deskControl.mini, deskControl.iconMini]}
				aria-label="Zoom in"
				onClick={() => void flow.zoomIn(ZOOM)}
			>
				<ZoomGlyph isIn />
			</Button>
			<Button
				size="small"
				css={deskControl.mini}
				onClick={() => void flow.fitView({ ...ZOOM, padding: 0.06 })}
			>
				Fit
			</Button>
		</span>
	)
}

// Three projections, three purposes, each said in its tooltip: the map that leads into the review, the tiers that place the change in the architecture, the two floors that show what it does to the system.
const PROJECTIONS: { id: Projection; title: string; purpose: string }[] = [
	{
		id: 'plan',
		title: 'Plan',
		purpose:
			'Map: the parts the change lives in, and the way into its domains',
	},
	{
		id: 'iso',
		title: 'Iso',
		purpose:
			'Tiers: where the change sits, from the interface down to the data',
	},
	{
		id: 'orbit',
		title: '3D',
		purpose:
			'Before \u2192 after: the system before the change, under the system after it',
	},
]

function Projections({
	projection,
	onProjection,
}: {
	projection: Projection
	onProjection: (projection: Projection) => void
}): ReactElement {
	return (
		<span
			{...stylex.props(canvas.tabs)}
			role="group"
			aria-label="Projection"
		>
			{PROJECTIONS.map(entry => (
				<Button
					key={entry.id}
					size="small"
					aria-pressed={entry.id === projection}
					aria-label={entry.purpose}
					data-tip={entry.purpose}
					css={[
						deskControl.mini,
						tip.host,
						tip.end,
						entry.id === projection && canvas.tabOn,
					]}
					onClick={() => onProjection(entry.id)}
				>
					{entry.title}
				</Button>
			))}
		</span>
	)
}

// The system view, then each path the guide tells step by step; the chosen one on the wash inside a petrol hairline. Then, at the bar's end, the projection's own control (the plan's zoom, the 3D view's before and after) and how the scene is drawn; the switch keeps its place as the control before it changes (the 3D view keeps its turning in its corner).
export function CanvasToolbar({
	views,
	current,
	hold,
}: {
	views: readonly ModelView[]
	current: Pick<
		CanvasScene,
		'view' | 'onView' | 'projection' | 'onProjection'
	>
	hold: OrbitHold
}): ReactElement {
	const viewId = current.view?.id ?? null
	const tabs = [
		{ id: null, title: 'System' },
		...views.map(view => ({ id: view.id, title: view.title })),
	]
	return (
		<div {...stylex.props(canvas.toolbar)}>
			<span
				{...stylex.props(canvas.tabs)}
				role="group"
				aria-label="Views"
			>
				{tabs.map(tab => (
					<Button
						key={tab.id ?? ''}
						size="small"
						aria-pressed={tab.id === viewId}
						css={[
							deskControl.mini,
							tab.id === viewId && canvas.tabOn,
						]}
						onClick={() => current.onView(tab.id)}
					>
						{tab.title}
					</Button>
				))}
			</span>
			<span {...stylex.props(canvas.end)}>
				{current.projection === 'plan' && <Zoom />}
				{current.projection === 'orbit' && <PoseSwitch hold={hold} />}
				<Projections
					projection={current.projection}
					onProjection={current.onProjection}
				/>
			</span>
		</div>
	)
}

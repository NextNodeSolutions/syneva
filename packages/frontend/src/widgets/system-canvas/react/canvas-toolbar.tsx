import { Button } from '@shared/ui/button'
import { deskControl } from '@shared/ui/desk-control.styles'
import * as stylex from '@stylexjs/stylex'
import { useReactFlow } from '@xyflow/react'

import { canvas } from './canvas.styles'

import type { ModelView } from '@entities/review/guide/system-model'
import type { ReactElement } from 'react'
import type { Projection } from '../model'
import type { CanvasScene } from './use-canvas-scene'

const ZOOM = { duration: 160 }

function ZoomGlyph({ isIn }: { isIn: boolean }): ReactElement {
	return (
		<svg
			width="12"
			height="12"
			viewBox="0 0 12 12"
			stroke="currentColor"
			strokeWidth="1.4"
			aria-hidden="true"
		>
			<path d={isIn ? 'M2 6h8M6 2v8' : 'M2 6h8'} />
		</svg>
	)
}

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

const PROJECTIONS: { id: Projection; title: string; label: string }[] = [
	{ id: 'plan', title: 'Plan', label: 'Flat plan' },
	{ id: 'iso', title: 'Iso', label: 'Isometric' },
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
					aria-label={entry.label}
					css={[
						deskControl.mini,
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

// The system view, then each path the guide tells step by step; the chosen one on the wash inside a petrol hairline. Then, at the bar's end, the plan's zoom and how the scene is drawn; the switch keeps its place when the zoom goes.
export function CanvasToolbar({
	views,
	current,
}: {
	views: readonly ModelView[]
	current: Pick<
		CanvasScene,
		'view' | 'onView' | 'projection' | 'onProjection'
	>
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
				<Projections
					projection={current.projection}
					onProjection={current.onProjection}
				/>
			</span>
		</div>
	)
}

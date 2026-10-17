import { Button } from '@shared/ui/button'
import { deskControl } from '@shared/ui/desk-control.styles'
import * as stylex from '@stylexjs/stylex'
import { useReactFlow } from '@xyflow/react'

import { canvas } from './canvas.styles'

import type { ModelView } from '@entities/review/guide/system-model'
import type { ReactElement } from 'react'

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

// The system view, then each path the guide tells step by step; the chosen one on the wash inside a petrol hairline.
export function CanvasToolbar({
	views,
	viewId,
	onView,
}: {
	views: readonly ModelView[]
	viewId: string | null
	onView: (id: string | null) => void
}): ReactElement {
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
						onClick={() => onView(tab.id)}
					>
						{tab.title}
					</Button>
				))}
			</span>
			<Zoom />
		</div>
	)
}

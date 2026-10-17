import '../system-canvas.css'
import { useCallback, useMemo, useState } from 'react'

import * as stylex from '@stylexjs/stylex'
import { ReactFlowProvider } from '@xyflow/react'

import { POSE_TILT } from '../projection/before-after'

import { CanvasActionsContext } from './canvas-actions'
import { CanvasFocusContext, canvasFocus } from './canvas-focus'
import { CanvasLegend } from './canvas-legend'
import { CanvasStage } from './canvas-stage'
import { CanvasToolbar } from './canvas-toolbar'
import { canvas } from './canvas.styles'
import { Inspector } from './inspector'
import { ModelText } from './model-text'
import { useCanvasScene } from './use-canvas-scene'
import { useOrbit } from './use-orbit'

import type { ModelView } from '@entities/review/guide/system-model'
import type { ReactElement } from 'react'
import type { SystemCanvasProps } from '../model'
import type { CanvasActions } from './canvas-actions'
import type { CanvasScene } from './use-canvas-scene'

// The part under the pointer, remembered with the field it was in: a field that goes (another view, another projection) takes its hover with it, even when the pointer never left it.
function useHovered(
	current: CanvasScene,
): [string | null, (id: string | null) => void] {
	const field = `${current.projection}:${current.sceneKey}`
	const [hover, setHover] = useState<{ field: string; id: string | null }>({
		field,
		id: null,
	})
	const onHover = useCallback(
		(id: string | null) => setHover({ field, id }),
		[field],
	)
	return [hover.field === field ? hover.id : null, onHover]
}

// The bar, the legend and the field, with the 3D camera's hold: a drag re-renders this much and no more. The camera starts over the floors, on the system after.
function CanvasFrame({
	views,
	current,
	onFail,
}: {
	views: readonly ModelView[]
	current: CanvasScene
	onFail: () => void
}): ReactElement {
	const hold = useOrbit(0, POSE_TILT.after)
	return (
		<>
			<CanvasToolbar views={views} current={current} hold={hold} />
			<CanvasLegend projection={current.projection} />
			<CanvasStage current={current} hold={hold} onFail={onFail} />
		</>
	)
}

// The visual level: the system the changeset lives in, drawn before any code. The agent's model laid out by ELK, drawn flat by React Flow with the desk's own tiles and rules, or raised from the same layout into an isometric or a 3D drawing; the parts a change touches carry its mark and the numbers of the domains that make it, and every domain leads on to its review.
export function SystemCanvas({
	model,
	domains,
	focusDomain,
	onOpenDomain,
}: SystemCanvasProps): ReactElement {
	const current = useCanvasScene(model)
	const [pointed, setPointed] = useState<string | null>(null)
	const [hovered, onHover] = useHovered(current)
	const [hasFailed, setFailed] = useState(false)
	const focus = canvasFocus(current.scene, domains, {
		selected: current.selected,
		hovered,
		domain: pointed ?? focusDomain,
	})
	const actions = useMemo<CanvasActions>(
		() => ({ onFocus: setPointed, onOpen: onOpenDomain, onHover }),
		[onOpenDomain, onHover],
	)
	return (
		<section
			aria-label="The system this change touches"
			data-guide-controls
			{...stylex.props(canvas.root)}
		>
			<ReactFlowProvider>
				<CanvasActionsContext value={actions}>
					<CanvasFocusContext value={focus}>
						<CanvasFrame
							views={model.views ?? []}
							current={current}
							onFail={() => setFailed(true)}
						/>
					</CanvasFocusContext>
				</CanvasActionsContext>
				<Inspector
					scene={current.scene}
					view={current.view}
					selected={current.selected}
					domains={domains}
					actions={actions}
					domainsOf={focus.domainsOf}
				/>
			</ReactFlowProvider>
			<ModelText model={model} domains={domains} isOpen={hasFailed} />
		</section>
	)
}

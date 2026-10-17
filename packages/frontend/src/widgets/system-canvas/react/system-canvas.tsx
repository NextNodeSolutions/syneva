import '../system-canvas.css'
import { useMemo, useState } from 'react'

import * as stylex from '@stylexjs/stylex'
import { ReactFlowProvider } from '@xyflow/react'

import { CanvasFocusContext, canvasFocus } from './canvas-focus'
import { CanvasStage } from './canvas-stage'
import { CanvasToolbar } from './canvas-toolbar'
import { canvas } from './canvas.styles'
import { Inspector } from './inspector'
import { ModelText } from './model-text'
import { useCanvasScene } from './use-canvas-scene'

import type { ReactElement } from 'react'
import type { SystemCanvasProps } from '../model'

// The visual level: the system the changeset lives in, drawn before any code. The agent's model laid out by ELK, drawn flat by React Flow with the desk's own tiles and rules, or raised from the same layout into an isometric drawing; the parts a change touches carry its mark and the numbers of the domains that make it, and every domain leads on to its review.
export function SystemCanvas({
	model,
	domains,
	focusDomain,
	onOpenDomain,
}: SystemCanvasProps): ReactElement {
	const current = useCanvasScene(model)
	const [pointed, setPointed] = useState<string | null>(null)
	const [hasFailed, setFailed] = useState(false)
	const focus = canvasFocus(
		current.scene,
		domains,
		current.selected,
		pointed ?? focusDomain,
	)
	const actions = useMemo(
		() => ({ onFocus: setPointed, onOpen: onOpenDomain }),
		[onOpenDomain],
	)
	return (
		<section
			aria-label="The system this change touches"
			data-guide-controls
			{...stylex.props(canvas.root)}
		>
			<ReactFlowProvider>
				<CanvasToolbar views={model.views ?? []} current={current} />
				<CanvasFocusContext value={focus}>
					<CanvasStage
						current={current}
						onFail={() => setFailed(true)}
					/>
				</CanvasFocusContext>
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

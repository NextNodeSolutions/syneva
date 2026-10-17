import { Suspense, useState } from 'react'

import { BlockBoundary } from '@shared/ui/block-boundary'
import * as stylex from '@stylexjs/stylex'

import { CanvasField } from './canvas-field'
import { canvas } from './canvas.styles'
import { OrbitField } from './orbit-field'
import { TierField } from './tier-field'

import type { ReactElement } from 'react'
import type { Scene } from '../layout/scene'
import type { Projection, Selection } from '../model'
import type { CanvasScene } from './use-canvas-scene'
import type { OrbitHold } from './use-orbit'

type FieldProps = Selection & { scene: Scene; hold: OrbitHold }

// Each projection's field, keyed by the scene: React Flow keeps its nodes once given. The 3D camera's hold is the canvas's, so it keeps its pose from one view to the next.
const FIELDS: Record<Projection, (props: FieldProps) => ReactElement> = {
	plan: CanvasField,
	iso: TierField,
	orbit: OrbitField,
}

// In place of a drawing that threw: says so, and opens the sentences under it.
function CanvasFailed({ onFail }: { onFail: () => void }): ReactElement {
	useState(() => {
		queueMicrotask(onFail)
		return null
	})
	return (
		<p {...stylex.props(canvas.failed)}>
			The drawing could not be shown; the parts and links are below, as
			text.
		</p>
	)
}

// The field for the current scene in the chosen projection: an empty field of the same height while ELK lays it out, the failure line should it throw.
export function CanvasStage({
	current,
	hold,
	onFail,
}: {
	current: CanvasScene
	hold: OrbitHold
	onFail: () => void
}): ReactElement {
	const Chosen = FIELDS[current.projection]
	return (
		<BlockBoundary fallback={<CanvasFailed onFail={onFail} />}>
			<Suspense fallback={<div {...stylex.props(canvas.field)} />}>
				<Chosen
					key={current.sceneKey}
					scene={current.scene}
					selected={current.selected}
					onSelect={current.onSelect}
					hold={hold}
				/>
			</Suspense>
		</BlockBoundary>
	)
}

import { Suspense, useState } from 'react'

import { BlockBoundary } from '@shared/ui/block-boundary'
import * as stylex from '@stylexjs/stylex'

import { CanvasField } from './canvas-field'
import { canvas } from './canvas.styles'
import { ProjectedField } from './projected-field'

import type { ReactElement } from 'react'
import type { CanvasScene } from './use-canvas-scene'

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
	onFail,
}: {
	current: CanvasScene
	onFail: () => void
}): ReactElement {
	return (
		<BlockBoundary fallback={<CanvasFailed onFail={onFail} />}>
			<Suspense fallback={<div {...stylex.props(canvas.field)} />}>
				{current.projection === 'plan' ? (
					<CanvasField
						key={current.sceneKey}
						scene={current.scene}
						selected={current.selected}
						onSelect={current.onSelect}
					/>
				) : (
					<ProjectedField
						key={`${current.projection}:${current.sceneKey}`}
						scene={current.scene}
						selected={current.selected}
						onSelect={current.onSelect}
					/>
				)}
			</Suspense>
		</BlockBoundary>
	)
}

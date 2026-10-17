import { useState } from 'react'

import type { SceneLink } from '../layout/scene'
import type { CanvasScene } from './use-canvas-scene'

export type CanvasSteps = {
	index: number
	step: SceneLink | undefined
	onStep: (index: number) => void
	onView: (id: string | null) => void
}

export function useCanvasSteps(
	current: Pick<CanvasScene, 'scene' | 'sceneKey' | 'viewId' | 'onView'>,
): CanvasSteps {
	const { scene, sceneKey } = current
	const [position, setPosition] = useState({ sceneKey, index: 0 })
	const index =
		position.sceneKey === sceneKey
			? Math.min(position.index, scene.links.length - 1)
			: 0
	return {
		index,
		step: scene.links[index]?.step ? scene.links[index] : undefined,
		onView: id => {
			if (id !== current.viewId) setPosition({ sceneKey, index: 0 })
			current.onView(id)
		},
		onStep: next =>
			setPosition({
				sceneKey,
				index: Math.max(0, Math.min(next, scene.links.length - 1)),
			}),
	}
}

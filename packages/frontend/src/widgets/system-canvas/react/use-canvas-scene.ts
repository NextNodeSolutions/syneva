import { useCallback, useMemo, useState } from 'react'

import { fingerprint } from '@shared/lib/fingerprint'

import { systemScene, viewScene } from '../layout/scene'

import type { GuideModel, ModelView } from '@entities/review/guide/system-model'
import type { Scene } from '../layout/scene'

export type CanvasScene = {
	view: ModelView | undefined
	scene: Scene
	// React Flow keeps its nodes once given: a new scene (another view, a new model) is a new field, keyed by this.
	sceneKey: string
	selected: string | null
	onSelect: (id: string | null) => void
	onView: (id: string | null) => void
}

// The view the reviewer chose (the system, or one of the paths) and the part they selected in it; choosing another view clears the selection.
export function useCanvasScene(model: GuideModel): CanvasScene {
	const [viewId, setViewId] = useState<string | null>(null)
	const [selected, setSelected] = useState<string | null>(null)
	const view = model.views?.find(entry => entry.id === viewId)
	const scene = useMemo(
		() => (view ? viewScene(model, view) : systemScene(model)),
		[model, view],
	)
	const onView = useCallback((id: string | null) => {
		setViewId(id)
		setSelected(null)
	}, [])
	return {
		view,
		scene,
		sceneKey: fingerprint(JSON.stringify(scene.input)),
		selected,
		onSelect: setSelected,
		onView,
	}
}

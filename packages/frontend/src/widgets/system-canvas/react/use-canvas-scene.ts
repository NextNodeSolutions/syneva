import { useCallback, useDeferredValue, useMemo, useState } from 'react'

import { fingerprint } from '@shared/lib/fingerprint'

import { systemScene, viewScene } from '../layout/scene'

import type { GuideModel, ModelView } from '@entities/review/guide/system-model'
import type { Scene } from '../layout/scene'
import type { Projection } from '../model'

export type CanvasScene = {
	// The view chosen in the toolbar, and the one drawn: a view ELK has not laid out yet leaves the one before it on the field until it is done, rather than the fallback's empty field (which collapsed the canvas and pushed it back open).
	viewId: string | null
	view: ModelView | undefined
	scene: Scene
	// React Flow keeps its nodes once given: a new scene (another view, a new model) is a new field, keyed by this.
	sceneKey: string
	selected: string | null
	onSelect: (id: string | null) => void
	onView: (id: string | null) => void
	projection: Projection
	onProjection: (projection: Projection) => void
}

// A selection belongs to the view it was made in: one made in the view still drawn while the next is laid out goes with it.
type Picked = { view: string | null; id: string | null }

// The view the reviewer chose (the system, or one of the paths), how it is drawn (flat, isometric, in 3D) and the part they selected in it; choosing another view clears the selection, another projection keeps it.
function keyOfScene(scene: Scene): string {
	return fingerprint(
		JSON.stringify({
			elements: [...scene.elements.values()],
			links: scene.links,
		}),
	)
}

export function useCanvasScene(model: GuideModel): CanvasScene {
	const [viewId, setViewId] = useState<string | null>(null)
	const [picked, setPicked] = useState<Picked>({ view: null, id: null })
	const [projection, setProjection] = useState<Projection>('plan')
	const activeId = model.views?.some(entry => entry.id === viewId)
		? viewId
		: null
	const deferredId = useDeferredValue(activeId)
	const view = model.views?.find(entry => entry.id === deferredId)
	const shownId = view?.id ?? null
	const scene = useMemo(
		() => (view ? viewScene(model, view) : systemScene(model)),
		[model, view],
	)
	const onSelect = useCallback(
		(id: string | null) => setPicked({ view: shownId, id }),
		[shownId],
	)
	const onView = useCallback(
		(id: string | null) => {
			if (id === activeId) return
			setViewId(id)
			setPicked({ view: id, id: null })
		},
		[activeId],
	)
	const sceneKey = useMemo(() => keyOfScene(scene), [scene])
	return {
		viewId: activeId,
		view,
		scene,
		sceneKey,
		selected:
			picked.view === shownId &&
			picked.id &&
			scene.elements.has(picked.id)
				? picked.id
				: null,
		onSelect,
		onView,
		projection,
		onProjection: setProjection,
	}
}

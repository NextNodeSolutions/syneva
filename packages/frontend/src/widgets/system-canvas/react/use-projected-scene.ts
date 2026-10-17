import { use, useMemo } from 'react'

import { layoutCanvas } from '../layout/canvas-layout'
import { fitCamera, ISO_TILT, turnFor } from '../projection/camera'
import { paintOrder } from '../projection/faces'
import { routesOf, solidsOf } from '../projection/solids'

import { useFieldSize } from './use-field-size'

import type { RefObject } from 'react'
import type { Scene } from '../layout/scene'
import type { Camera, Size } from '../projection/camera'
import type { Route, Solid } from '../projection/solids'

export type ProjectedScene = {
	height: number
	camera: Camera
	floor: Size
	solids: Solid[]
	routes: Route[]
	// Platforms then blocks, each back to front.
	order: { platforms: Solid[]; blocks: Solid[] }
}

// The scene raised and framed: the plan's ELK layout as solids and routes, seen by the isometric camera that fits the field.
export function useProjectedScene(
	scene: Scene,
	field: RefObject<HTMLDivElement | null>,
): ProjectedScene {
	const layout = use(layoutCanvas(scene.input))
	const size = useFieldSize(field, layout)
	const solids = useMemo(() => solidsOf(layout), [layout])
	const routes = useMemo(() => routesOf(layout, solids), [layout, solids])
	const turn = turnFor(layout.direction)
	const stage = {
		floor: { width: layout.width, height: layout.height },
		top: Math.max(0, ...solids.map(solid => solid.top)),
		field: size,
	}
	const camera = fitCamera({ turn, tilt: ISO_TILT }, stage)
	return {
		height: size.height,
		camera,
		floor: stage.floor,
		solids,
		routes,
		order: paintOrder(solids, camera, stage.floor),
	}
}

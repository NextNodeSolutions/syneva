import { use, useMemo } from 'react'

import { layoutCanvas } from '../layout/canvas-layout'
import {
	fitCamera,
	fitPoints,
	ISO_TILT,
	orbitCamera,
	TIERS_TURN,
	turnFor,
} from '../projection/camera'
import { planRaised } from '../projection/plan-raised'
import { extentOf, paintOrder } from '../projection/raised'
import { tierRaised } from '../projection/tier-raised'

import { useFieldSize } from './use-field-size'
import { useOrbit } from './use-orbit'

import type { RefObject } from 'react'
import type { Scene } from '../layout/scene'
import type { Paint, Raised } from '../projection/raised'
import type { View } from './solid-shape'
import type { OrbitHold } from './use-orbit'

export type RaisedScene = {
	height: number
	raised: Raised
	view: View
	// The drawing back to front for this camera.
	paints: Paint[]
}

// The tiers framed: built from the plan's layout (its order across the flow), seen by the isometric camera that fits them in the field.
export function useTierScene(
	scene: Scene,
	field: RefObject<HTMLDivElement | null>,
): RaisedScene {
	const layout = use(layoutCanvas(scene.input))
	const size = useFieldSize(field, layout)
	const raised = useMemo(() => tierRaised(scene, layout), [scene, layout])
	const extent = useMemo(() => extentOf(raised), [raised])
	// Framed on what stands in it, not on its box: the floors step up to the right, so the box's far corners are empty.
	const camera = fitPoints(
		{ turn: TIERS_TURN, tilt: ISO_TILT },
		raised.floor,
		extent,
		size,
	)
	return {
		height: size.height,
		raised,
		view: { camera, floor: raised.floor },
		paints: paintOrder(raised, camera),
	}
}

// The plan raised and turned by the reviewer's orbit.
export function useOrbitScene(
	scene: Scene,
	field: RefObject<HTMLDivElement | null>,
): RaisedScene & { hold: OrbitHold } {
	const layout = use(layoutCanvas(scene.input))
	const size = useFieldSize(field, layout)
	const raised = useMemo(() => planRaised(scene, layout), [scene, layout])
	const turn = turnFor(layout.direction)
	const hold = useOrbit(turn, ISO_TILT)
	const stage = { floor: raised.floor, top: raised.top, field: size }
	const fitted = fitCamera({ turn, tilt: ISO_TILT }, stage)
	const camera = orbitCamera(fitted, hold.orbit, stage)
	return {
		height: size.height,
		raised,
		view: { camera, floor: raised.floor },
		paints: paintOrder(raised, camera),
		hold,
	}
}

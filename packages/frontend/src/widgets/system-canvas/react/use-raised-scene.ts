import { use, useMemo } from 'react'

import { layoutCanvas } from '../layout/canvas-layout'
import { beforeAfter, sideOf } from '../projection/before-after'
import {
	fitCamera,
	fitPoints,
	ISO_TILT,
	orbitCamera,
	TIERS_TURN,
	turnFor,
} from '../projection/camera'
import { extentOf, paintOrder } from '../projection/raised'
import { tierRaised } from '../projection/tier-raised'

import { useFieldSize } from './use-field-size'

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

// The system before and after, turned by the reviewer's hold from the turn the plan's flow reads best at. The floors are rebuilt only when the camera crosses from over them to under them: which floor is near decides what steps back and what keeps its name.
export function useOrbitScene(
	scene: Scene,
	field: RefObject<HTMLDivElement | null>,
	hold: OrbitHold,
): RaisedScene {
	const layout = use(layoutCanvas(scene.input))
	const size = useFieldSize(field, layout)
	const turn = turnFor(layout.direction)
	const orbit = {
		turn: turn + hold.orbit.turn,
		tilt: hold.orbit.tilt,
		zoom: hold.orbit.zoom,
	}
	const isDown = sideOf(hold.orbit.tilt) === 'after'
	const raised = useMemo(
		() => beforeAfter(scene, layout, isDown),
		[scene, layout, isDown],
	)
	const stage = { floor: raised.floor, top: raised.top, field: size }
	const fitted = fitCamera({ turn, tilt: ISO_TILT }, stage)
	const camera = orbitCamera(fitted, orbit, stage)
	return {
		height: size.height,
		raised,
		view: { camera, floor: raised.floor },
		paints: paintOrder(raised, camera),
	}
}

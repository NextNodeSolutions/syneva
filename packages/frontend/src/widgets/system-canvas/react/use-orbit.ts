import { useCallback, useMemo, useRef, useState } from 'react'

import type { Dispatch, PointerEvent, SetStateAction } from 'react'
import type { Orbit } from '../projection/camera'

// The reviewer's hold on the 3D camera: a drag turns the scene (across) and tilts it (up and down), the buttons step it and zoom, Reset puts it back where it started. A press that never moves stays a click, so selecting a part still works; once it moves the field captures the pointer, so the click that ends a drag never lands on a part.

const TURN_PER_PIXEL = 0.4
const TILT_PER_PIXEL = 0.3
const MIN_TILT = 10
const MAX_TILT = 75
const DRAG_THRESHOLD = 4
const ZOOM_STEP = 1.25
const MIN_ZOOM = 0.4
const MAX_ZOOM = 3
const TURN_STEP = 15

type Press = {
	x: number
	y: number
	turn: number
	tilt: number
	moved: boolean
}

export type OrbitHold = {
	orbit: Orbit
	onPointerDown: (event: PointerEvent<HTMLDivElement>) => void
	onPointerMove: (event: PointerEvent<HTMLDivElement>) => void
	onPointerUp: () => void
	turnBy: (sign: number) => void
	zoomBy: (sign: number) => void
	reset: () => void
}

const clamp = (low: number, amount: number, high: number): number =>
	Math.min(high, Math.max(low, amount))

type Drag = Pick<OrbitHold, 'onPointerDown' | 'onPointerMove' | 'onPointerUp'>

function useDrag(
	orbit: Orbit,
	setOrbit: Dispatch<SetStateAction<Orbit>>,
): Drag {
	const press = useRef<Press | null>(null)
	const onPointerDown = useCallback(
		(event: PointerEvent<HTMLDivElement>) => {
			const isControl =
				event.target instanceof Element &&
				event.target.closest('button')
			if (event.button !== 0 || isControl) return
			press.current = {
				x: event.clientX,
				y: event.clientY,
				turn: orbit.turn,
				tilt: orbit.tilt,
				moved: false,
			}
		},
		[orbit.turn, orbit.tilt],
	)
	const onPointerMove = useCallback(
		(event: PointerEvent<HTMLDivElement>) => {
			const held = press.current
			if (!held) return
			const dx = event.clientX - held.x
			const dy = event.clientY - held.y
			if (!held.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
			if (!held.moved)
				event.currentTarget.setPointerCapture(event.pointerId)
			held.moved = true
			setOrbit(current => ({
				...current,
				turn: held.turn + dx * TURN_PER_PIXEL,
				tilt: clamp(
					MIN_TILT,
					held.tilt - dy * TILT_PER_PIXEL,
					MAX_TILT,
				),
			}))
		},
		[setOrbit],
	)
	const onPointerUp = useCallback(() => {
		press.current = null
	}, [])
	return { onPointerDown, onPointerMove, onPointerUp }
}

export function useOrbit(turn: number, tilt: number): OrbitHold {
	const initial = useMemo(() => ({ turn, tilt, zoom: 1 }), [turn, tilt])
	const [orbit, setOrbit] = useState<Orbit>(initial)
	const drag = useDrag(orbit, setOrbit)
	const turnBy = useCallback((sign: number) => {
		setOrbit(current => ({
			...current,
			turn: current.turn + sign * TURN_STEP,
		}))
	}, [])
	const zoomBy = useCallback((sign: number) => {
		setOrbit(current => ({
			...current,
			zoom: clamp(MIN_ZOOM, current.zoom * ZOOM_STEP ** sign, MAX_ZOOM),
		}))
	}, [])
	const reset = useCallback(() => setOrbit(initial), [initial])
	return { orbit, ...drag, turnBy, zoomBy, reset }
}

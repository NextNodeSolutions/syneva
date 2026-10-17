import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { isMotionReduced, MOTION_MS } from '@shared/lib/motion'

import type { Dispatch, PointerEvent, SetStateAction } from 'react'
import type { Orbit } from '../projection/camera'

// The reviewer's hold on the 3D camera: a drag turns the scene (across) and tilts it (up and down), from over the floors to under them; the buttons step it and zoom, a pose eases it over or under the floors, Reset puts it back where it started. A press that never moves stays a click, so selecting a part still works; once it moves the field captures the pointer, so the click that ends a drag never lands on a part. The turn is held as a step from the scene's own turn, so the hold outlives the scene it was taken on.

const TURN_PER_PIXEL = 0.4
const TILT_PER_PIXEL = 0.3
// Never quite level with the floors: from the side they are lines.
const MIN_TILT = 10
const MAX_TILT = 170
const DRAG_THRESHOLD = 4
const ZOOM_STEP = 1.25
const MIN_ZOOM = 0.4
const MAX_ZOOM = 3
const TURN_STEP = 15
// A cubic ease-out, near the design system's deceleration: a confident arrival, no overshoot.
const EASE_POWER = 3

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
	// Eases the camera to a tilt, keeping its turn and zoom.
	poseTo: (tilt: number) => void
	reset: () => void
}

const clamp = (low: number, amount: number, high: number): number =>
	Math.min(high, Math.max(low, amount))

type Drag = Pick<OrbitHold, 'onPointerDown' | 'onPointerMove' | 'onPointerUp'>

function useDrag(
	orbit: Orbit,
	setOrbit: Dispatch<SetStateAction<Orbit>>,
	stop: () => void,
): Drag {
	const press = useRef<Press | null>(null)
	const onPointerDown = useCallback(
		(event: PointerEvent<HTMLDivElement>) => {
			const isControl =
				event.target instanceof Element &&
				event.target.closest('button')
			if (event.button !== 0 || isControl) return
			stop()
			press.current = {
				x: event.clientX,
				y: event.clientY,
				turn: orbit.turn,
				tilt: orbit.tilt,
				moved: false,
			}
		},
		[orbit.turn, orbit.tilt, stop],
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

// The tilt eased to a pose over the time a move takes, frame by frame (the camera is arithmetic, not an element to animate); at once when the reviewer asks for less motion. A new pose, a drag or the field going stops the one under way.
function usePose(
	orbit: Orbit,
	setOrbit: Dispatch<SetStateAction<Orbit>>,
): { poseTo: (tilt: number) => void; stop: () => void } {
	const frame = useRef<number | null>(null)
	const stop = useCallback(() => {
		if (frame.current !== null) cancelAnimationFrame(frame.current)
		frame.current = null
	}, [])
	useEffect(() => stop, [stop])
	const poseTo = useCallback(
		(tilt: number) => {
			stop()
			if (isMotionReduced()) {
				setOrbit(current => ({ ...current, tilt }))
				return
			}
			const from = orbit.tilt
			const start = performance.now()
			const step = (now: number): void => {
				const done = Math.min(1, (now - start) / MOTION_MS.move)
				const eased = 1 - (1 - done) ** EASE_POWER
				setOrbit(current => ({
					...current,
					tilt: from + (tilt - from) * eased,
				}))
				frame.current = done < 1 ? requestAnimationFrame(step) : null
			}
			frame.current = requestAnimationFrame(step)
		},
		[orbit.tilt, setOrbit, stop],
	)
	return { poseTo, stop }
}

export function useOrbit(turn: number, tilt: number): OrbitHold {
	const initial = useMemo(() => ({ turn, tilt, zoom: 1 }), [turn, tilt])
	const [orbit, setOrbit] = useState<Orbit>(initial)
	const pose = usePose(orbit, setOrbit)
	const drag = useDrag(orbit, setOrbit, pose.stop)
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
	const { stop } = pose
	const reset = useCallback(() => {
		stop()
		setOrbit(initial)
	}, [initial, stop])
	return { orbit, ...drag, turnBy, zoomBy, poseTo: pose.poseTo, reset }
}

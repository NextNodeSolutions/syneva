import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { isMotionReduced, MOTION_MS } from '@shared/lib/motion'

import { useOrbitDrag } from './use-orbit-drag'

import type { Dispatch, SetStateAction } from 'react'
import type { Orbit } from '../projection/camera'
import type { OrbitDrag } from './use-orbit-drag'

const ZOOM_STEP = 1.25
const MIN_ZOOM = 0.4
const MAX_ZOOM = 3
const TURN_STEP = 15
const EASE_POWER = 3

export type OrbitHold = Omit<OrbitDrag, 'stopDrag'> & {
	orbit: Orbit
	turnBy: (sign: number) => void
	zoomBy: (sign: number) => void
	poseTo: (tilt: number) => void
	stop: () => void
	reset: () => void
}

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
			if (isMotionReduced() || tilt === orbit.tilt) {
				setOrbit(current => ({ ...current, tilt }))
				return
			}
			const from = orbit.tilt
			const start = performance.now()
			const step = (now: number): void => {
				const done = isMotionReduced()
					? 1
					: Math.min(1, (now - start) / MOTION_MS.move)
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
	const { stopDrag, ...drag } = useOrbitDrag(orbit, setOrbit, pose.stop)
	const stop = (): void => {
		stopDrag()
		pose.stop()
	}
	const turnBy = (sign: number): void => {
		stop()
		setOrbit(current => ({
			...current,
			turn: current.turn + sign * TURN_STEP,
		}))
	}
	const zoomBy = (sign: number): void => {
		stop()
		setOrbit(current => ({
			...current,
			zoom: Math.min(
				MAX_ZOOM,
				Math.max(MIN_ZOOM, current.zoom * ZOOM_STEP ** sign),
			),
		}))
	}
	const poseTo = (target: number): void => {
		stopDrag()
		pose.poseTo(target)
	}
	const reset = (): void => {
		stop()
		setOrbit(initial)
	}
	return { orbit, ...drag, turnBy, zoomBy, poseTo, stop, reset }
}

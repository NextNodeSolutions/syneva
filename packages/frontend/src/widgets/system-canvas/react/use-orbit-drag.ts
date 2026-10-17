import { useEffect, useState } from 'react'

import type { Dispatch, MouseEvent, PointerEvent, SetStateAction } from 'react'
import type { Orbit } from '../projection/camera'

const TURN_PER_PIXEL = 0.4
const TILT_PER_PIXEL = 0.3
const MIN_TILT = 10
const MAX_TILT = 170
const DRAG_THRESHOLD = 4

type Press = {
	pointerId: number
	surface: HTMLDivElement
	x: number
	y: number
	turn: number
	tilt: number
}

export type OrbitDrag = {
	onPointerDown: (event: PointerEvent<HTMLDivElement>) => void
	onPointerMove: (event: PointerEvent<HTMLDivElement>) => void
	onPointerUp: (event: PointerEvent<HTMLDivElement>) => void
	onClickCapture: (event: MouseEvent<HTMLDivElement>) => void
	stopDrag: () => void
}

type DragControl = Omit<OrbitDrag, 'onPointerDown' | 'onPointerUp'> & {
	begin: (event: PointerEvent<HTMLDivElement>, orbit: Orbit) => void
	release: (pointerId: number) => void
}

function beginPress(
	event: PointerEvent<HTMLDivElement>,
	orbit: Orbit,
): Press | null {
	if (event.button !== 0 || !event.isPrimary) return null
	if (event.target instanceof Element && event.target.closest('button'))
		return null
	return {
		pointerId: event.pointerId,
		surface: event.currentTarget,
		x: event.clientX,
		y: event.clientY,
		turn: orbit.turn,
		tilt: orbit.tilt,
	}
}

function dragPose(
	event: PointerEvent<HTMLDivElement>,
	press: Press,
): Pick<Orbit, 'turn' | 'tilt'> {
	return {
		turn: press.turn + (event.clientX - press.x) * TURN_PER_PIXEL,
		tilt: Math.min(
			MAX_TILT,
			Math.max(
				MIN_TILT,
				press.tilt - (event.clientY - press.y) * TILT_PER_PIXEL,
			),
		),
	}
}

function createDrag(
	setOrbit: Dispatch<SetStateAction<Orbit>>,
	stopPose: () => void,
): DragControl {
	let press: Press | null = null
	let hasDragged = false
	const stopDrag = (): void => {
		const held = press
		press = null
		if (held?.surface.hasPointerCapture(held.pointerId))
			held.surface.releasePointerCapture(held.pointerId)
	}
	return {
		begin: (event, orbit) => {
			stopDrag()
			hasDragged = false
			press = beginPress(event, orbit)
			if (press) stopPose()
		},
		onPointerMove: event => {
			if (!press || press.pointerId !== event.pointerId) return
			if (!event.buttons) {
				stopDrag()
				return
			}
			if (
				!hasDragged &&
				Math.hypot(event.clientX - press.x, event.clientY - press.y) <
					DRAG_THRESHOLD
			)
				return
			event.currentTarget.setPointerCapture(event.pointerId)
			hasDragged = true
			const pose = dragPose(event, press)
			setOrbit(current => ({ ...current, ...pose }))
		},
		release: pointerId => {
			if (press?.pointerId === pointerId) stopDrag()
		},
		onClickCapture: event => {
			if (!hasDragged) return
			hasDragged = false
			event.stopPropagation()
		},
		stopDrag,
	}
}

export function useOrbitDrag(
	orbit: Orbit,
	setOrbit: Dispatch<SetStateAction<Orbit>>,
	stopPose: () => void,
): OrbitDrag {
	const [drag] = useState(() => createDrag(setOrbit, stopPose))
	useEffect(() => {
		const release = (event: globalThis.PointerEvent): void =>
			drag.release(event.pointerId)
		window.addEventListener('pointerup', release)
		window.addEventListener('pointercancel', release)
		window.addEventListener('blur', drag.stopDrag)
		return () => {
			drag.stopDrag()
			window.removeEventListener('pointerup', release)
			window.removeEventListener('pointercancel', release)
			window.removeEventListener('blur', drag.stopDrag)
		}
	}, [drag])
	return {
		onPointerDown: event => drag.begin(event, orbit),
		onPointerMove: drag.onPointerMove,
		onPointerUp: event => drag.release(event.pointerId),
		onClickCapture: drag.onClickCapture,
		stopDrag: drag.stopDrag,
	}
}

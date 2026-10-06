import { useLayoutEffect, useRef } from 'react'

import { EASE_OUT, isMotionReduced, MOTION_MS } from './motion'

import type { RefObject } from 'react'

export type Place = { x: number; y: number }

// The points a move passes through between where it was and where it is (both excluded): none
// for a straight move. A route that must go around something (the circuit's return) names its
// corners.
export type FlipRoute = (from: Place, to: Place) => readonly Place[]

const STRAIGHT: FlipRoute = () => []

// A routed move takes longer by half its straight time for each corner it turns: the way round
// is longer than the way across.
const CORNER_SHARE = 0.5

// The lift a moving element takes while it travels: it has left the page for a moment, so it
// casts the system's one floating shadow (DESIGN.md, Elevation).
const LIFTED = '0 12px 32px rgb(25 27 24 / 14%)'

function placesOf(container: Element): Map<string, Place> {
	const origin = container.getBoundingClientRect()
	const places = new Map<string, Place>()
	for (const element of container.querySelectorAll('[data-flip]')) {
		const key = element.getAttribute('data-flip')
		if (!key) continue
		const box = element.getBoundingClientRect()
		places.set(key, { x: box.left - origin.left, y: box.top - origin.top })
	}
	return places
}

function offset(point: Place, to: Place): string {
	return `translate(${point.x - to.x}px, ${point.y - to.y}px)`
}

function travel(
	element: Element,
	move: { from: Place; to: Place; route: FlipRoute },
): void {
	const { from, to } = move
	if (from.x === to.x && from.y === to.y) return
	const corners = move.route(from, to).map(point => ({
		transform: offset(point, to),
	}))
	element.animate(
		[
			{ transform: offset(from, to), boxShadow: LIFTED },
			...corners,
			{ transform: 'none' },
		],
		{
			duration: MOTION_MS.move * (1 + corners.length * CORNER_SHARE),
			easing: EASE_OUT,
		},
	)
}

// Every keyed child that has a place before and after plays its move.
function playMoves(
	root: Element,
	moves: {
		before: Map<string, Place>
		after: Map<string, Place>
		route: FlipRoute
	},
): void {
	for (const element of root.querySelectorAll('[data-flip]')) {
		const key = element.getAttribute('data-flip') ?? ''
		const from = moves.before.get(key)
		const to = moves.after.get(key)
		if (from && to) travel(element, { from, to, route: moves.route })
	}
}

// FLIP for keyed children ([data-flip="<key>"]) of `container`: after each render, every child
// that changed place plays from where it was to where it is, so a desk that moves to another
// column or group is seen moving rather than vanishing and reappearing. Places are measured
// against the container, so a page scroll between two renders never reads as a move.
export function useFlip(
	container: RefObject<Element | null>,
	route: FlipRoute = STRAIGHT,
): void {
	const last = useRef<Map<string, Place>>(new Map())
	useLayoutEffect(() => {
		const root = container.current
		if (!root) return
		const now = placesOf(root)
		if (!isMotionReduced())
			playMoves(root, { before: last.current, after: now, route })
		last.current = now
	})
}

import { useLayoutEffect, useRef } from 'react'

import { EASE_OUT, isEntering, isMotionReduced, MOTION_MS } from './motion'

import type { RefObject } from 'react'

// A keyed child's place in its container, and the group it sits in (data-flip-group: a
// circuit station), when it names one.
export type Place = { x: number; y: number; group?: string | undefined }

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

// A traveller paints over the neighbours it crosses (they keep z-index auto), and one that
// changes group over the others travelling with it. Kept low: the page's own layers (the
// toast, the panels) stay above.
const OVER_NEIGHBOURS = 1
const OVER_TRAVELLERS = 2

const TRANSPARENT = 'rgba(0, 0, 0, 0)'

// A shift shorter than this is a neighbour's text settling (a count, an age), not a desk
// moving: it is taken in place, never flown with the lift.
const MIN_TRAVEL_PX = 3

type Snapshot = { places: Map<string, Place>; width: number }

const NO_SNAPSHOT: Snapshot = { places: new Map(), width: 0 }

// The flight each element is on, so a move that starts while one is in the air takes over
// from where the element is seen, instead of jumping back to where it was laid out.
const flights = new WeakMap<Element, Animation>()

// Where an element is laid out, not where it is painted: offsetLeft/offsetTop summed up its
// offset chain ignore every transform on it and above it (an entrance's pose, a travel still in
// flight), which would otherwise read as a move.
function layoutPlace(element: HTMLElement): Place {
	const place = { x: 0, y: 0 }
	for (
		let node: Element | null = element;
		node instanceof HTMLElement;
		node = node.offsetParent
	) {
		place.x += node.offsetLeft
		place.y += node.offsetTop
	}
	return place
}

function keyedChildren(container: HTMLElement): NodeListOf<HTMLElement> {
	return container.querySelectorAll<HTMLElement>('[data-flip]')
}

function placesOf(container: HTMLElement): Map<string, Place> {
	const origin = layoutPlace(container)
	const places = new Map<string, Place>()
	for (const element of keyedChildren(container)) {
		const key = element.getAttribute('data-flip')
		if (!key) continue
		const box = layoutPlace(element)
		places.set(key, {
			x: box.x - origin.x,
			y: box.y - origin.y,
			group: element.getAttribute('data-flip-group') ?? undefined,
		})
	}
	return places
}

function snapshotOf(container: HTMLElement): Snapshot {
	return { places: placesOf(container), width: container.clientWidth }
}

// How far from its layout place an element is seen now: its flight's current offset, none when
// it is not in the air.
function seenOffset(element: Element): Place {
	if (flights.get(element)?.playState !== 'running') return { x: 0, y: 0 }
	const seen = new DOMMatrixReadOnly(getComputedStyle(element).transform)
	return { x: seen.m41, y: seen.m42 }
}

// What a traveller keeps on in every frame: its layer and, for one with no ground of its own
// (a ledger row), the page's paper (`ground`), so the rows it crosses never show through it.
function liftOf(
	element: Element,
	{ isRegrouped, ground }: { isRegrouped: boolean; ground: string },
): Keyframe {
	const zIndex = isRegrouped ? OVER_TRAVELLERS : OVER_NEIGHBOURS
	if (getComputedStyle(element).backgroundColor !== TRANSPARENT)
		return { zIndex }
	return { zIndex, backgroundColor: ground }
}

function offset(point: Place, to: Place): string {
	return `translate(${point.x - to.x}px, ${point.y - to.y}px)`
}

// A move about to play, with every style it reads already taken: all of them are read before
// the first one starts, so starting a flight never forces a style pass for the next one.
type Flight = {
	element: HTMLElement
	start: Place
	to: Place
	corners: readonly Place[]
	lift: Keyframe
}

function flightOf(
	element: HTMLElement,
	move: { from: Place; to: Place; route: FlipRoute; ground: string },
): Flight | null {
	const { from, to } = move
	const isNudge =
		Math.abs(from.x - to.x) < MIN_TRAVEL_PX &&
		Math.abs(from.y - to.y) < MIN_TRAVEL_PX
	if (isNudge) return null
	const seen = seenOffset(element)
	return {
		element,
		start: { x: from.x + seen.x, y: from.y + seen.y },
		to,
		corners: move.route(from, to),
		lift: liftOf(element, {
			isRegrouped: from.group !== to.group,
			ground: move.ground,
		}),
	}
}

function fly({ element, start, to, corners, lift }: Flight): void {
	const turns = corners.map(point => ({
		...lift,
		transform: offset(point, to),
	}))
	flights.get(element)?.cancel()
	const flight = element.animate(
		[
			{ ...lift, transform: offset(start, to), boxShadow: LIFTED },
			...turns,
			{ ...lift, transform: 'none' },
		],
		{
			duration: MOTION_MS.move * (1 + turns.length * CORNER_SHARE),
			easing: EASE_OUT,
		},
	)
	flights.set(element, flight)
}

// Every keyed child that has a place before and after plays its move: all the moves are read
// first, then all of them start.
function playMoves(
	root: HTMLElement,
	moves: {
		before: Map<string, Place>
		after: Map<string, Place>
		route: FlipRoute
	},
): void {
	const ground = getComputedStyle(document.body).backgroundColor
	const planned: Flight[] = []
	for (const element of keyedChildren(root)) {
		const key = element.getAttribute('data-flip') ?? ''
		const from = moves.before.get(key)
		const to = moves.after.get(key)
		const flight =
			from && to
				? flightOf(element, { from, to, route: moves.route, ground })
				: null
		if (flight) planned.push(flight)
	}
	for (const flight of planned) fly(flight)
}

// FLIP for keyed children ([data-flip="<key>"]) of `container`: after each render, every child
// that changed place plays from where it was to where it is, so a desk that moves to another
// column or group is seen moving rather than vanishing and reappearing. Places are measured
// against the container, so a page scroll between two renders never reads as a move. A
// container that changes size between renders (the sidebar folds, the window resizes) re-lays
// its children out with no desk moving: its places are taken afresh as it happens, and a
// render that finds it at another width plays nothing.
export function useFlip(
	container: RefObject<HTMLElement | null>,
	route: FlipRoute = STRAIGHT,
): void {
	const last = useRef<Snapshot>(NO_SNAPSHOT)
	useLayoutEffect(() => {
		const root = container.current
		if (!root) return undefined
		const observer = new ResizeObserver(() => {
			if (!isMotionReduced()) last.current = snapshotOf(root)
		})
		observer.observe(root)
		return (): void => observer.disconnect()
	}, [container])
	useLayoutEffect(() => {
		const root = container.current
		if (!root) return
		// Reduced motion plays no travel, so it measures nothing either: a poll's render
		// forces no layout.
		if (isMotionReduced()) {
			last.current = NO_SNAPSHOT
			return
		}
		const now = snapshotOf(root)
		// A child that moves while the page is still entering is taken at its new place: it
		// enters there, it is not seen travelling to it.
		if (now.width === last.current.width && !isEntering())
			playMoves(root, {
				before: last.current.places,
				after: now.places,
				route,
			})
		last.current = now
	})
}

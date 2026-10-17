import { isFacing } from './camera'
import { nearness } from './faces'

import type { ChangeMark } from '@entities/review/guide/model'
import type { ModelElement } from '@entities/review/guide/system-model'
import type { SceneLink } from '../layout/scene'
import type { Camera, Point3, Size } from './camera'
import type { Route, Solid } from './solids'

// A raised drawing is a stack of decks: floors the parts stand on (or hang under), the links run over them, and what joins one deck to another. Each projection builds its own (the tiers, the system before and after); this module only paints them, back to front, for whatever camera looks at them.

// A part of the model on a deck: the volume it fills, the change this deck shows on it, how deep it nests (the outer platform is painted under the inner one), and how loud it is.
export type RaisedPart = {
	key: string
	solid: Solid
	element: ModelElement
	mark?: ChangeMark | undefined
	level: number
	// Stepped back: on the deck away from the viewer, whatever is not news there.
	isQuiet: boolean
	// Whether its name floats beside it; a far deck names only what is news on it.
	isNamed: boolean
	// Whether it wears its domains' numbers on a face (the tiers) rather than in its name.
	isNumbered: boolean
}

export type RaisedLink = {
	key: string
	route: Route
	link: SceneLink
	mark?: ChangeMark | undefined
	isQuiet: boolean
	// Whether it says its words before anyone looks at it.
	isWorded: boolean
}

// One floor of the drawing: its slabs (the floor, and any ledge beside it), the parts on it, the links run over it. Its parts stand on its slabs, or hang under them.
export type Deck = {
	id: string
	name: string
	slabs: Solid[]
	parts: RaisedPart[]
	links: RaisedLink[]
	isHanging: boolean
}

// A thin vertical rule from one deck to the next: the same part on both.
export type Trace = { key: string; id: string; from: Point3; to: Point3 }

export type Raised = {
	// The box every coordinate lies in: the footprint, and the height of the tallest thing (nothing goes under 0).
	floor: Size
	top: number
	// Lowest first.
	decks: Deck[]
	// Links painted over every deck (the tiers' drops run in front of the floors).
	overlay: RaisedLink[]
	traces: Trace[]
}

export type Paint =
	| { kind: 'slab'; key: string; solid: Solid }
	| { kind: 'part'; key: string; part: RaisedPart }
	| { kind: 'link'; key: string; link: RaisedLink }
	| { kind: 'trace'; key: string; trace: Trace }

const UP = { x: 0, y: 0, z: 1 }

// Every corner of every volume and every bend of every link: what a camera must frame to show the whole drawing and nothing more.
export function extentOf(raised: Raised): Point3[] {
	const solids = raised.decks.flatMap(deck => [
		...deck.slabs,
		...deck.parts.map(part => part.solid),
	])
	const links = [
		...raised.overlay,
		...raised.decks.flatMap(deck => deck.links),
	]
	return [
		...solids.flatMap(solid =>
			[solid.base, solid.top].flatMap(z => [
				{ x: solid.x, y: solid.y, z },
				{ x: solid.x + solid.width, y: solid.y, z },
				{ x: solid.x, y: solid.y + solid.length, z },
				{ x: solid.x + solid.width, y: solid.y + solid.length, z },
			]),
		),
		...links.flatMap(link => link.route.points),
	]
}

export function isLookingDown(camera: Camera): boolean {
	return isFacing(camera, UP)
}

function toPaint(part: RaisedPart): Paint {
	return { kind: 'part', key: part.key, part }
}

// One deck back to front. Seen from the side its parts are on, the slab goes first, then the platforms outer to inner, the links over them, the blocks farthest first; seen from the other side, the same in reverse, the slab last over everything it holds (a slab is translucent, so what it holds shows through, stepped back).
function deckPaint(deck: Deck, camera: Camera, floor: Size): Paint[] {
	const seesParts = deck.isHanging !== isLookingDown(camera)
	const slabs = deck.slabs.map((solid): Paint => ({
		kind: 'slab',
		key: solid.id,
		solid,
	}))
	const platforms = deck.parts
		.filter(part => part.solid.isPlatform)
		.toSorted((a, b) => a.level - b.level)
		.map(toPaint)
	const blocks = deck.parts
		.filter(part => !part.solid.isPlatform)
		.toSorted(
			(a, b) =>
				nearness(a.solid, camera, floor) -
				nearness(b.solid, camera, floor),
		)
		.map(toPaint)
	const links = deck.links.map((link): Paint => ({
		kind: 'link',
		key: link.key,
		link,
	}))
	if (seesParts) return [...slabs, ...platforms, ...links, ...blocks]
	return [...blocks, ...links, ...platforms.toReversed(), ...slabs]
}

// The whole drawing back to front: the farther deck first, the traces between the first two, the overlay last.
export function paintOrder(raised: Raised, camera: Camera): Paint[] {
	const decks = isLookingDown(camera)
		? raised.decks
		: raised.decks.toReversed()
	const traces = raised.traces.map((trace): Paint => ({
		kind: 'trace',
		key: trace.key,
		trace,
	}))
	const [first, ...rest] = decks.map(deck =>
		deckPaint(deck, camera, raised.floor),
	)
	return [
		...(first ?? []),
		...traces,
		...rest.flat(),
		...raised.overlay.map((link): Paint => ({
			kind: 'link',
			key: link.key,
			link,
		})),
	]
}

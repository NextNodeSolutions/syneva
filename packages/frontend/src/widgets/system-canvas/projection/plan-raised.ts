import { routesOf, solidsOf } from './solids'

import type { CanvasLayout } from '../layout/canvas-layout'
import type { Scene } from '../layout/scene'
import type { Raised, RaisedLink, RaisedPart } from './raised'
import type { Route, Solid } from './solids'

// The plan raised as it lies: one deck, its containers as platforms and its parts as blocks on ELK's layout, its links over the ground they cross. The parts and links a deck shows are the caller's to choose.

export type PlanDeck = {
	solids: Solid[]
	routes: Route[]
	top: number
}

export function planDeck(layout: CanvasLayout): PlanDeck {
	const solids = solidsOf(layout)
	return {
		solids,
		routes: routesOf(layout, solids),
		top: Math.max(0, ...solids.map(solid => solid.top)),
	}
}

// How many platforms a part stands on: the outer platform is painted first.
function levelOf(layout: CanvasLayout, id: string): number {
	const parent = layout.boxes.find(box => box.id === id)?.parent
	return parent ? 1 + levelOf(layout, parent) : 0
}

export function planParts(
	scene: Scene,
	layout: CanvasLayout,
	solids: readonly Solid[],
): RaisedPart[] {
	return solids.flatMap(solid => {
		const element = scene.elements.get(solid.id)
		if (!element) return []
		return [
			{
				key: solid.id,
				solid,
				element,
				mark: element.change,
				level: levelOf(layout, solid.id),
				isQuiet: false,
				isNamed: true,
				isNumbered: false,
			},
		]
	})
}

export function planLinks(
	scene: Scene,
	routes: readonly Route[],
): RaisedLink[] {
	const links = new Map(scene.links.map(link => [link.id, link]))
	return routes.flatMap(route => {
		const link = links.get(route.id)
		if (!link) return []
		return [
			{
				key: route.id,
				route,
				link,
				mark: link.change,
				isQuiet: false,
				isWorded: Boolean(link.change ?? link.step),
			},
		]
	})
}

// The plan raised whole, on one deck with no slab of its own.
export function planRaised(scene: Scene, layout: CanvasLayout): Raised {
	const deck = planDeck(layout)
	return {
		floor: { width: layout.width, height: layout.height },
		top: deck.top,
		decks: [
			{
				id: 'plan',
				name: '',
				slabs: [],
				parts: planParts(scene, layout, deck.solids),
				links: planLinks(scene, deck.routes),
				isHanging: false,
			},
		],
		overlay: [],
		traces: [],
	}
}

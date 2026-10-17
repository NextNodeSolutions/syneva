import { PLATFORM } from './solids'
import { TIER_BLOCK } from './tier-spots'

import type { ModelElement } from '@entities/review/guide/system-model'
import type { Scene } from '../layout/scene'
import type { Solid } from './solids'
import type { Spot } from './tier-spots'

// The tiers as volumes: each floor a slab one rise above the one under it, a rim part on a ledge at its floor's height, a container a thin dashed zone around its parts on every floor they stand on, one zone's thickness above the zone that holds it. A part is as tall as its change is loud: an unchanged one a low block, a changed one raised, an added one the highest, a removed one sunk to its ghosted footprint.

export const TIER_RISE = 200
const ZONE = 2
const ZONE_PAD = 14
export const TIER_LEDGE = 12
const HEIGHT = { rest: 16, changed: 32, added: 48, removed: 4 } as const
const SIDES = 2

export function surfaceOf(floor: number): number {
	return PLATFORM + floor * TIER_RISE
}

// The containers above a part in this scene, nearest first.
export function holdersOf(scene: Scene, id: string): string[] {
	const parent = scene.elements.get(id)?.parent
	return parent && scene.elements.has(parent)
		? [parent, ...holdersOf(scene, parent)]
		: []
}

// A floor part stands on the innermost zone around it; a rim part on its ledge.
export function blockOf(
	spot: Spot,
	element: ModelElement,
	zones: number,
): Solid {
	const base = surfaceOf(spot.floor) + ZONE * zones
	return {
		id: element.id,
		isPlatform: false,
		x: spot.x,
		y: spot.y,
		width: TIER_BLOCK.width,
		length: TIER_BLOCK.length,
		base,
		top: base + HEIGHT[element.change ?? 'rest'],
	}
}

// How many containers deep a container goes: its zone keeps that many paddings of room around its parts, so a nested zone sits inside the one that holds it.
export function nesting(scene: Scene, id: string): number {
	const inner = [...scene.elements.values()].filter(
		element =>
			element.parent === id &&
			[...scene.elements.values()].some(
				part => part.parent === element.id,
			),
	)
	return 1 + Math.max(0, ...inner.map(child => nesting(scene, child.id)))
}

export type ZoneSpec = {
	holder: string
	floor: number
	// How many containers hold this one.
	depth: number
	pad: number
}

export function zoneOf(spec: ZoneSpec, members: readonly Solid[]): Solid {
	const x = Math.min(...members.map(member => member.x)) - spec.pad
	const y = Math.min(...members.map(member => member.y)) - spec.pad
	const right = Math.max(...members.map(member => member.x + member.width))
	const front = Math.max(...members.map(member => member.y + member.length))
	const base = surfaceOf(spec.floor) + ZONE * spec.depth
	return {
		id: `${spec.holder}@${String(spec.floor)}`,
		isPlatform: true,
		x,
		y,
		width: right + spec.pad - x,
		length: front + spec.pad - y,
		base,
		top: base + ZONE,
	}
}

export function zonePad(scene: Scene, holder: string): number {
	return ZONE_PAD * nesting(scene, holder)
}

// A slab whose top is the floor's surface: the floor itself, or a rim part's ledge.
export function slabOf(
	id: string,
	footprint: Pick<Solid, 'x' | 'y' | 'width' | 'length'>,
	floor: number,
): Solid {
	const surface = surfaceOf(floor)
	return {
		id,
		isPlatform: true,
		...footprint,
		base: surface - PLATFORM,
		top: surface,
	}
}

export function ledgeOf(spot: Spot): Solid {
	return slabOf(
		`ledge:${spot.id}`,
		{
			x: spot.x - TIER_LEDGE,
			y: spot.y - TIER_LEDGE,
			width: TIER_BLOCK.width + TIER_LEDGE * SIDES,
			length: TIER_BLOCK.length + TIER_LEDGE * SIDES,
		},
		spot.floor,
	)
}

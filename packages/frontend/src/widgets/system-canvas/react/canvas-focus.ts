import { createContext, use } from 'react'

import { partsOf } from '../layout/scene'

import type { ModelElement } from '@entities/review/guide/system-model'
import type { SceneLink, Scene } from '../layout/scene'
import type { CanvasDomain } from '../model'

// What the canvas lights up: the domain the reviewer points at with the parts it changes, else the part under the pointer, else the part they selected (with what it holds) and the parts it talks to. Everything else steps back; a container holding a lit part stays as it is. Read through context, so a hover never rebuilds React Flow's nodes.

export type Tone = 'rest' | 'lit' | 'dim'

export type CanvasFocus = {
	toneOf: (id: string) => Tone
	linkTone: (link: SceneLink) => Tone
	domainsOf: (element: ModelElement) => CanvasDomain[]
}

const REST: CanvasFocus = {
	toneOf: () => 'rest',
	linkTone: () => 'rest',
	domainsOf: () => [],
}

// Where the reviewer's attention is: what they selected, the part under the pointer, the domain they point at (in the drawing, the inspector or the overview's list).
export type FocusTarget = {
	selected: string | null
	hovered: string | null
	domain: string | null
}

export const CanvasFocusContext = createContext<CanvasFocus>(REST)

export function useCanvasFocus(): CanvasFocus {
	return use(CanvasFocusContext)
}

function holders(scene: Scene, ids: ReadonlySet<string>): Set<string> {
	const held = new Set<string>()
	for (const id of ids) {
		let parent = scene.elements.get(id)?.parent
		while (parent && !held.has(parent)) {
			held.add(parent)
			parent = scene.elements.get(parent)?.parent
		}
	}
	return held
}

type Lit = { ids: Set<string>; picked: ReadonlySet<string> | null }

function litIds(scene: Scene, target: FocusTarget): Lit | null {
	const { domain } = target
	const part = target.hovered ?? target.selected
	if (!domain && part && scene.elements.has(part)) {
		const picked = partsOf(scene, part)
		const partners = scene.links.flatMap(link => {
			if (picked.has(link.from)) return [link.to]
			if (picked.has(link.to)) return [link.from]
			return []
		})
		return { ids: new Set([...picked, ...partners]), picked }
	}
	if (!domain) return null
	return {
		ids: new Set(
			[...scene.elements.values()]
				.filter(element => element.domains?.includes(domain))
				.map(element => element.id),
		),
		picked: null,
	}
}

// A link says its words when its change is the news (a changed relation, a path's step) or when the reviewer is looking at it; every other link stays a quiet rule.
export function isLinkWorded(link: SceneLink, tone: Tone): boolean {
	return Boolean(link.change ?? link.step) || tone === 'lit'
}

export function canvasFocus(
	scene: Scene,
	domains: readonly CanvasDomain[],
	target: FocusTarget,
): CanvasFocus {
	const byId = new Map(domains.map(entry => [entry.id, entry]))
	const domainsOf = (element: ModelElement): CanvasDomain[] =>
		(element.domains ?? []).flatMap(id => byId.get(id) ?? [])
	const lit = litIds(scene, target)
	if (!lit) return { ...REST, domainsOf }
	const held = holders(scene, lit.ids)
	const { picked } = lit
	return {
		domainsOf,
		toneOf: id => {
			if (lit.ids.has(id)) return 'lit'
			return held.has(id) ? 'rest' : 'dim'
		},
		linkTone: link => {
			const touches = picked
				? picked.has(link.from) || picked.has(link.to)
				: lit.ids.has(link.from) && lit.ids.has(link.to)
			return touches ? 'lit' : 'dim'
		},
	}
}

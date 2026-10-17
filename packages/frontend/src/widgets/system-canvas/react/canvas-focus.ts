import { createContext, use } from 'react'

import { partsOf } from '../layout/scene'

import type { ModelElement } from '@entities/review/guide/system-model'
import type { SceneLink, Scene } from '../layout/scene'
import type { CanvasDomain } from '../model'

// What the canvas lights up: the element the reviewer selected (with what it holds) and the parts it talks to, else the domain they point at with the parts it changes. Everything else steps back; a container holding a lit part stays as it is. Read through context, so a hover never rebuilds React Flow's nodes.

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

function litIds(
	scene: Scene,
	selected: string | null,
	domain: string | null,
): Lit | null {
	if (selected && scene.elements.has(selected)) {
		const picked = partsOf(scene, selected)
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

export function canvasFocus(
	scene: Scene,
	domains: readonly CanvasDomain[],
	selected: string | null,
	domain: string | null,
): CanvasFocus {
	const byId = new Map(domains.map(entry => [entry.id, entry]))
	const domainsOf = (element: ModelElement): CanvasDomain[] =>
		(element.domains ?? []).flatMap(id => byId.get(id) ?? [])
	const lit = litIds(scene, selected, domain)
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

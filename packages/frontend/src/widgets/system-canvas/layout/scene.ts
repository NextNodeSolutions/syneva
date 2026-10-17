import { linkLabelWidth, TILE_WIDTH, tileHeight } from './element-size'

import type { ChangeMark } from '@entities/review/guide/model'
import type {
	GuideModel,
	ModelElement,
	ModelView,
} from '@entities/review/guide/system-model'
import type { CanvasInput } from './canvas-layout'

// What the canvas draws for one view of the model: the system view draws every element and relation, a dynamic view only the elements its steps pass through (inside the parents that hold them) and one numbered link per step.

export type SceneLink = {
	id: string
	from: string
	to: string
	label?: string | undefined
	technology?: string | undefined
	change?: ChangeMark | undefined
	// A dynamic view's step number, from 1.
	step?: number | undefined
}

export type Scene = {
	input: CanvasInput
	elements: ReadonlyMap<string, ModelElement>
	links: SceneLink[]
}

export function linkText(link: SceneLink): string {
	return [link.label, link.technology].filter(Boolean).join(' · ')
}

function isWithin(scene: Scene, id: string, holder: string): boolean {
	let current: string | undefined = id
	while (current && current !== holder)
		current = scene.elements.get(current)?.parent
	return current === holder
}

// An element with every part it holds: selecting a container selects the service with its parts.
export function partsOf(scene: Scene, id: string): Set<string> {
	return new Set(
		[...scene.elements.keys()].filter(part => isWithin(scene, part, id)),
	)
}

function sceneOf(elements: readonly ModelElement[], links: SceneLink[]): Scene {
	const parents = new Set(elements.map(element => element.parent))
	return {
		input: {
			// A parent's size is ELK's to find, around its children.
			boxes: elements.map(element => ({
				id: element.id,
				parent: element.parent,
				width: parents.has(element.id) ? 0 : TILE_WIDTH,
				height: parents.has(element.id) ? 0 : tileHeight(element),
			})),
			links: links.map(link => {
				const text = linkText(link)
				return {
					id: link.id,
					from: link.from,
					to: link.to,
					labelWidth:
						text || link.step
							? linkLabelWidth(text, Boolean(link.step))
							: undefined,
				}
			}),
		},
		elements: new Map(elements.map(element => [element.id, element])),
		links,
	}
}

export function systemScene(model: GuideModel): Scene {
	return sceneOf(
		model.elements,
		model.relations.map((relation, index) => ({
			...relation,
			id: `r${String(index)}`,
		})),
	)
}

// The elements a view passes through and every parent holding them, in the model's order.
function viewElements(model: GuideModel, view: ModelView): ModelElement[] {
	const byId = new Map(model.elements.map(element => [element.id, element]))
	const kept = new Set<string>()
	const keep = (end: string): void => {
		let id: string | undefined = end
		while (id && !kept.has(id)) {
			kept.add(id)
			id = byId.get(id)?.parent
		}
	}
	for (const step of view.steps) {
		keep(step.from)
		keep(step.to)
	}
	return model.elements.filter(element => kept.has(element.id))
}

export function viewScene(model: GuideModel, view: ModelView): Scene {
	return sceneOf(
		viewElements(model, view),
		view.steps.map((step, index) => ({
			...step,
			id: `s${String(index)}`,
			step: index + 1,
		})),
	)
}

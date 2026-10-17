import { CHANGE_WORDS } from '@shared/ui/change-mark.styles'

import { KIND_WORDS } from './kind-glyph'

import type { ModelElement } from '@entities/review/guide/system-model'
import type { CanvasLayout } from '../layout/canvas-layout'
import type { Scene } from '../layout/scene'
import type { ContainerFlowNode, ElementFlowNode } from './element-node'
import type { LinkFlowEdge } from './link-edge'

export type FlowElements = {
	nodes: (ElementFlowNode | ContainerFlowNode)[]
	edges: LinkFlowEdge[]
}

// What a screen reader hears for a part: its name, its kind, what the change does to it.
function spokenName(element: ModelElement): string {
	return [
		element.label,
		KIND_WORDS[element.kind],
		element.change && CHANGE_WORDS[element.change],
	]
		.filter(Boolean)
		.join(', ')
}

// The laid-out scene as React Flow's nodes and edges: fixed boxes nobody drags or wires, each a button a reviewer can select by pointer or keyboard, each link drawn from its own route.
export function flowElements(
	scene: Scene,
	layout: CanvasLayout,
	selected: string | null,
): FlowElements {
	const routes = new Map(layout.links.map(laid => [laid.id, laid]))
	return {
		nodes: layout.boxes.flatMap(
			(box): (ElementFlowNode | ContainerFlowNode)[] => {
				const element = scene.elements.get(box.id)
				if (!element) return []
				const base = {
					id: box.id,
					position: { x: box.x, y: box.y },
					width: box.width,
					height: box.height,
					...(box.parent && { parentId: box.parent }),
					data: { element },
					draggable: false,
					connectable: false,
					selected: box.id === selected,
					ariaRole: 'button',
					ariaLabel: spokenName(element),
				} as const
				return [
					box.isGroup
						? { ...base, type: 'container' }
						: { ...base, type: 'element' },
				]
			},
		),
		edges: scene.links.map(link => {
			const laid = routes.get(link.id)
			return {
				id: link.id,
				type: 'link',
				source: link.from,
				target: link.to,
				selectable: false,
				focusable: false,
				data: {
					link,
					points: laid?.points ?? [],
					label: laid?.label,
				},
			}
		}),
	}
}

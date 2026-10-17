import { KIND_WORDS } from './kind-glyph'

import type { CanvasLayout } from '../layout/canvas-layout'
import type { Scene } from '../layout/scene'
import type { ContainerFlowNode, ElementFlowNode } from './element-node'
import type { LinkFlowEdge } from './link-edge'

export type FlowElements = {
	nodes: (ElementFlowNode | ContainerFlowNode)[]
	edges: LinkFlowEdge[]
}

// The laid-out scene as React Flow's nodes and edges: fixed boxes nobody drags or wires, each a button a reviewer can select by pointer or keyboard, each link drawn from its own route.
export function flowElements(scene: Scene, layout: CanvasLayout): FlowElements {
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
					ariaRole: 'button',
					ariaLabel: `${element.label}, ${KIND_WORDS[element.kind]}`,
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

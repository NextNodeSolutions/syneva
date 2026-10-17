import { LAYERED_OPTIONS, runElk } from '@shared/lib/graph-layout'

import { LINK_LABEL_HEIGHT } from './element-size'

import type { Point, Rect } from '@shared/lib/graph-layout'
import type { ElkExtendedEdge, ElkNode } from 'elkjs/lib/elk.bundled.js'

// The canvas is one compound ELK graph: an element sits inside its parent, which ELK sizes around it, and every link is routed across the nesting from the root (hierarchy handling), its points in the root's frame so React Flow draws it where it lies. Boxes come back relative to their parent, as React Flow places a child.

export type BoxInput = {
	id: string
	parent?: string | undefined
	width: number
	height: number
}

export type LinkInput = {
	id: string
	from: string
	to: string
	labelWidth?: number | undefined
}

export type CanvasInput = { boxes: BoxInput[]; links: LinkInput[] }

export type LaidBox = Rect & {
	id: string
	parent?: string | undefined
	isGroup: boolean
}

export type LaidLink = { id: string; points: Point[]; label?: Rect | undefined }

export type CanvasLayout = {
	// Parents before their children, as React Flow wants them.
	boxes: LaidBox[]
	links: LaidLink[]
	width: number
	height: number
}

// Room above a group's children for its head: its name and badges, then its kind and change.
const GROUP_PADDING = '[top=60,left=16,bottom=16,right=16]'
const CACHE_LIMIT = 40

type Direction = 'DOWN' | 'RIGHT'

// The box the canvas fits a layout into on a wide overview: of the two directions, the one drawn larger in it wins (a deep chain reads down, a wide fan across), down on a tie as C4 diagrams read.
export const REFERENCE = { width: 1060, height: 760 }

const OPTIONS = {
	...LAYERED_OPTIONS,
	'elk.hierarchyHandling': 'INCLUDE_CHILDREN',
	'elk.json.edgeCoords': 'ROOT',
	'elk.padding': '[top=16,left=16,bottom=16,right=16]',
	'elk.spacing.nodeNode': '24',
	'elk.spacing.edgeNode': '14',
	'elk.spacing.edgeLabel': '4',
	'elk.layered.spacing.nodeNodeBetweenLayers': '28',
	'elk.layered.spacing.edgeNodeBetweenLayers': '14',
}

// A label at its link's head end, beside the line: a centred label would take a layer of its own and double the drawing's depth.
const LABEL_OPTIONS = { 'elk.edgeLabels.placement': 'HEAD' }

const cache = new Map<string, Promise<CanvasLayout>>()

function elkNode(
	box: BoxInput,
	byParent: ReadonlyMap<string, BoxInput[]>,
): ElkNode {
	const children = byParent.get(box.id) ?? []
	if (!children.length)
		return { id: box.id, width: box.width, height: box.height }
	return {
		id: box.id,
		layoutOptions: { 'elk.padding': GROUP_PADDING },
		children: children.map(child => elkNode(child, byParent)),
	}
}

function elkGraph(input: CanvasInput, direction: Direction): ElkNode {
	const ids = new Set(input.boxes.map(box => box.id))
	const byParent = new Map<string, BoxInput[]>()
	for (const box of input.boxes) {
		const parent = box.parent && ids.has(box.parent) ? box.parent : ''
		byParent.set(parent, [...(byParent.get(parent) ?? []), box])
	}
	return {
		id: 'root',
		layoutOptions: { ...OPTIONS, 'elk.direction': direction },
		children: (byParent.get('') ?? []).map(box => elkNode(box, byParent)),
		edges: input.links.map(link => ({
			id: link.id,
			sources: [link.from],
			targets: [link.to],
			...(link.labelWidth && {
				labels: [
					{
						text: link.id,
						width: link.labelWidth,
						height: LINK_LABEL_HEIGHT,
						layoutOptions: LABEL_OPTIONS,
					},
				],
			}),
		})),
	}
}

function readBoxes(
	node: ElkNode,
	parent: string | undefined,
	boxes: LaidBox[] = [],
): LaidBox[] {
	for (const child of node.children ?? []) {
		boxes.push({
			id: child.id,
			parent,
			isGroup: Boolean(child.children?.length),
			x: child.x ?? 0,
			y: child.y ?? 0,
			width: child.width ?? 0,
			height: child.height ?? 0,
		})
		readBoxes(child, child.id, boxes)
	}
	return boxes
}

function readLink(edge: ElkExtendedEdge): LaidLink {
	const points = (edge.sections ?? []).flatMap(section =>
		[section.startPoint].concat(section.bendPoints ?? [], section.endPoint),
	)
	const [label] = edge.labels ?? []
	return {
		id: edge.id,
		points,
		label: label && {
			x: label.x ?? 0,
			y: label.y ?? 0,
			width: label.width ?? 0,
			height: label.height ?? 0,
		},
	}
}

// The scale a layout is drawn at to fit a box, never above its own size.
export function fitScale(
	layout: Pick<CanvasLayout, 'width' | 'height'>,
	box: { width: number; height: number },
): number {
	return Math.min(1, box.width / layout.width, box.height / layout.height)
}

async function laidOut(
	input: CanvasInput,
	direction: Direction,
): Promise<CanvasLayout> {
	const laid = await runElk(elkGraph(input, direction))
	return {
		boxes: readBoxes(laid, undefined),
		links: (laid.edges ?? []).map(readLink),
		width: Math.ceil(laid.width ?? 0),
		height: Math.ceil(laid.height ?? 0),
	}
}

async function runCanvasLayout(input: CanvasInput): Promise<CanvasLayout> {
	const [down, right] = await Promise.all([
		laidOut(input, 'DOWN'),
		laidOut(input, 'RIGHT'),
	])
	return fitScale(right, REFERENCE) > fitScale(down, REFERENCE) ? right : down
}

// One promise per distinct scene, so `use` reads the same settled layout across renders (a poll, a hover).
export function layoutCanvas(input: CanvasInput): Promise<CanvasLayout> {
	const key = JSON.stringify(input)
	const known = cache.get(key)
	if (known) return known
	const laid = runCanvasLayout(input)
	if (cache.size >= CACHE_LIMIT) {
		const [oldest] = cache.keys()
		if (oldest) cache.delete(oldest)
	}
	cache.set(key, laid)
	return laid
}

import ELK from 'elkjs/lib/elk.bundled.js'

import { labelWidth } from './label-width'

import type {
	ElkEdgeSection,
	ElkExtendedEdge,
	ElkNode,
	LayoutOptions,
} from 'elkjs/lib/elk.bundled.js'

// The graph diagrams (flow, state, data model) and the system canvas are laid out by ELK's layered algorithm: layers ordered to cut crossings, edges routed orthogonally between the boxes, labels placed on their edge and counted in the drawing's size. Only lazy chunks import it, so a review that draws no graph never loads it.

export type GraphNodeInput = {
	id: string
	width: number
	height: number
	// Pins a node to the first or last layer (an initial or final state).
	layer?: 'first' | 'last' | undefined
}

export type GraphEdgeInput = {
	from: string
	to: string
	label?: string | undefined
}

export type GraphInput = {
	direction: 'DOWN' | 'RIGHT'
	nodes: readonly GraphNodeInput[]
	edges: readonly GraphEdgeInput[]
}

export type Point = { x: number; y: number }
export type Rect = Point & { width: number; height: number }

export type LaidEdge = { points: Point[]; label?: Rect | undefined }

export type GraphLayout = {
	nodes: ReadonlyMap<string, Rect>
	// In the input's order, so the caller pairs each with its own edge.
	edges: LaidEdge[]
	width: number
	height: number
}

const LABEL_HEIGHT = 12
const CACHE_LIMIT = 200

export const LAYERED_OPTIONS: LayoutOptions = {
	'elk.algorithm': 'layered',
	'elk.edgeRouting': 'ORTHOGONAL',
	'elk.padding': '[top=10,left=10,bottom=10,right=10]',
	'elk.spacing.nodeNode': '20',
	'elk.spacing.edgeNode': '12',
	'elk.spacing.edgeEdge': '10',
	'elk.spacing.edgeLabel': '4',
	'elk.layered.spacing.nodeNodeBetweenLayers': '36',
	'elk.layered.spacing.edgeNodeBetweenLayers': '14',
	'elk.layered.spacing.edgeEdgeBetweenLayers': '10',
	'elk.edgeLabels.placement': 'CENTER',
	// The author's order is a reading order: kept wherever it costs no crossing.
	'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES',
	'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
}

const LAYER_CONSTRAINT = { first: 'FIRST', last: 'LAST' } as const

let engine: InstanceType<typeof ELK> | undefined
const cache = new Map<string, Promise<GraphLayout>>()

function elkGraph(input: GraphInput): ElkNode {
	return {
		id: 'root',
		layoutOptions: { ...LAYERED_OPTIONS, 'elk.direction': input.direction },
		children: input.nodes.map(node => ({
			id: node.id,
			width: node.width,
			height: node.height,
			...(node.layer && {
				layoutOptions: {
					'elk.layered.layering.layerConstraint':
						LAYER_CONSTRAINT[node.layer],
				},
			}),
		})),
		edges: input.edges.map((edge, index) => ({
			id: `e${String(index)}`,
			sources: [edge.from],
			targets: [edge.to],
			...(edge.label && {
				labels: [
					{
						text: edge.label,
						width: labelWidth(edge.label),
						height: LABEL_HEIGHT,
					},
				],
			}),
		})),
	}
}

function sectionPoints(section: ElkEdgeSection): Point[] {
	return [section.startPoint, ...(section.bendPoints ?? []), section.endPoint]
}

function laidEdge(edge: ElkExtendedEdge | undefined): LaidEdge {
	const points = (edge?.sections ?? []).flatMap(sectionPoints)
	const [label] = edge?.labels ?? []
	return {
		points,
		label: label && {
			x: label.x ?? 0,
			y: label.y ?? 0,
			width: label.width ?? 0,
			height: label.height ?? 0,
		},
	}
}

function readLayout(input: GraphInput, laid: ElkNode): GraphLayout {
	const nodes = new Map(
		(laid.children ?? []).map(node => [
			node.id,
			{
				x: node.x ?? 0,
				y: node.y ?? 0,
				width: node.width ?? 0,
				height: node.height ?? 0,
			},
		]),
	)
	const byId = new Map((laid.edges ?? []).map(edge => [edge.id, edge]))
	return {
		nodes,
		edges: input.edges.map((_, index) =>
			laidEdge(byId.get(`e${String(index)}`)),
		),
		width: Math.ceil(laid.width ?? 0),
		height: Math.ceil(laid.height ?? 0),
	}
}

// The engine itself, for a caller that builds its own ELK graph (the canvas nests elements inside their parents).
export async function runElk(graph: ElkNode): Promise<ElkNode> {
	engine ??= new ELK()
	return engine.layout(graph)
}

async function runLayout(input: GraphInput): Promise<GraphLayout> {
	const laidGraph = await runElk(elkGraph(input))
	return readLayout(input, laidGraph)
}

// One promise per distinct graph: a re-render (a poll, a verdict) reads the settled layout instead of laying the same graph out again, and `use` needs the very same promise across renders.
export function layoutGraph(input: GraphInput): Promise<GraphLayout> {
	const key = JSON.stringify(input)
	const known = cache.get(key)
	if (known) return known
	const laid = runLayout(input)
	if (cache.size >= CACHE_LIMIT) {
		const [oldest] = cache.keys()
		if (oldest) cache.delete(oldest)
	}
	cache.set(key, laid)
	return laid
}

const CORNER = 6
const HALF = 2

// An orthogonal route drawn with its corners rounded, each radius capped by the shorter of its two legs so a short jog never overshoots.
export function routePath(points: readonly Point[]): string {
	const [first, ...rest] = points
	if (!first) return ''
	const parts = [`M${first.x} ${first.y}`]
	rest.forEach((point, index) => {
		const previous = points[index] ?? first
		const next = rest[index + 1]
		if (!next) {
			parts.push(`L${point.x} ${point.y}`)
			return
		}
		const radius = Math.min(
			CORNER,
			Math.hypot(point.x - previous.x, point.y - previous.y) / HALF,
			Math.hypot(next.x - point.x, next.y - point.y) / HALF,
		)
		const into = towards(point, previous, radius)
		const out = towards(point, next, radius)
		parts.push(
			`L${into.x} ${into.y}`,
			`Q${point.x} ${point.y} ${out.x} ${out.y}`,
		)
	})
	return parts.join(' ')
}

function towards(from: Point, to: Point, distance: number): Point {
	const length = Math.hypot(to.x - from.x, to.y - from.y) || 1
	return {
		x: from.x + ((to.x - from.x) / length) * distance,
		y: from.y + ((to.y - from.y) / length) * distance,
	}
}

// The label's baseline inside the box ELK reserved for it.
const LABEL_BASELINE = 2

export type LabelAnchor = {
	x: number
	y: number
	anchor: 'start' | 'middle' | 'end'
}

function closestPoint(points: readonly Point[], target: Point): Point {
	let best = points[0] ?? target
	let bestDistance = Infinity
	points.slice(1).forEach((point, index) => {
		const start = points[index] ?? point
		const dx = point.x - start.x
		const dy = point.y - start.y
		const length = dx * dx + dy * dy || 1
		const along = Math.max(
			0,
			Math.min(
				1,
				((target.x - start.x) * dx + (target.y - start.y) * dy) /
					length,
			),
		)
		const candidate = { x: start.x + along * dx, y: start.y + along * dy }
		const distance = Math.hypot(
			candidate.x - target.x,
			candidate.y - target.y,
		)
		if (distance < bestDistance) {
			best = candidate
			bestDistance = distance
		}
	})
	return best
}

// ELK reserves a box beside the edge sized by the estimated label width, which runs wider than the drawn words: a label beside a vertical leg is set flush against the edge's side of its box (so the words hug their line), one over a horizontal leg stays centred.
export function labelAnchor(edge: LaidEdge): LabelAnchor | undefined {
	const box = edge.label
	if (!box) return undefined
	const centre = { x: box.x + box.width / HALF, y: box.y + box.height / HALF }
	const nearest = closestPoint(edge.points, centre)
	const dx = centre.x - nearest.x
	const y = box.y + box.height - LABEL_BASELINE
	if (Math.abs(dx) <= Math.abs(centre.y - nearest.y))
		return { x: centre.x, y, anchor: 'middle' }
	return dx > 0
		? { x: box.x, y, anchor: 'start' }
		: { x: box.x + box.width, y, anchor: 'end' }
}

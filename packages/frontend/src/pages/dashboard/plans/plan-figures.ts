import { decodeBlock } from '@entities/review/guide/decode-blocks'
import { isDiagramBlock } from '@entities/review/guide/model'
import { graphOf } from '@widgets/guide-pane/react/blocks/diagram-lines'

import type { DiagramBlock } from '@entities/review/guide/model'

export type PlanFigure =
	| { ok: true; block: DiagramBlock; source: string }
	| { ok: false; reason: string; source: string }

// What the drawing cannot place: an edge naming a node the figure does not declare.
function unplaced(block: DiagramBlock): string | null {
	const { nodes, edges } = graphOf(block)
	const ids = new Set(nodes.map(node => node.id))
	const stray = edges
		.flatMap(edge => [edge.from, edge.to])
		.find(id => !ids.has(id))
	if (!stray) return null
	return `"${stray}" is not one of its nodes`
}

function decodeFigure(json: unknown, index: number): DiagramBlock | string {
	const raw =
		typeof json === 'object' && json !== null && !Array.isArray(json)
			? { id: `figure-${String(index)}`, ...json }
			: json
	const block = decodeBlock(raw, { endpoint: 'plan figure' })
	if (!isDiagramBlock(block))
		return 'its kind must be state, sequence or flow'
	return unplaced(block) ?? block
}

// A figure is one diagram block in the guide's JSON shape. Anything else is shown as its source
// under a notice naming the problem: a figure never keeps the page from reading.
export function parseFigure(source: string, index: number): PlanFigure {
	try {
		const decoded = decodeFigure(JSON.parse(source), index)
		if (typeof decoded === 'string')
			return { ok: false, reason: decoded, source }
		return { ok: true, block: decoded, source }
	} catch (error) {
		const reason =
			error instanceof Error ? error.message : 'it does not read'
		return { ok: false, reason, source }
	}
}

// Whether the plan holds a figure fence (renderPlanMarkdown draws the ones at its top level):
// its page then loads the drawing beside the renderer rather than after it.
const FIGURE_FENCE = /^ {0,3}(?:`{3,}|~{3,})[ \t]*syneva\b/m

export function hasFigures(markdown: string): boolean {
	return FIGURE_FENCE.test(markdown)
}

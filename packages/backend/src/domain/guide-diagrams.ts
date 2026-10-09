// The three diagram blocks: nodes declared once, every edge end naming a declared node, so a diagram never draws an arrow into nothing; refs resolve through the domain's references like any block's.
import { EDGE_BOUNDS, parseEdges, STEP_BOUNDS } from './guide-diagram-edges.js'
import { GUIDE_KEYS } from './guide-keys.js'
import {
	identifier,
	list,
	onlyKeys,
	optionalBoolean,
	optionalText,
	record,
	text,
	uniqueIds,
} from './guide-parse.js'
import { parseOptionalRef } from './guide-refs.js'
import { GUIDE_LIMITS } from './guide-shapes.js'

import type { BlockInput } from './guide-blocks.js'
import type { ListBounds, Parsed } from './guide-parse.js'
import type { BlockScope } from './guide-refs.js'
import type { ExplanationBlock } from './guide-shapes.js'

const NODE_BOUNDS: ListBounds = { min: 1, max: GUIDE_LIMITS.diagramNodes }

// What every diagram node shares (an id, a label, an optional code ref) plus the raw record for a kind's own fields.
type Node = {
	id: string
	label: string
	ref?: string | undefined
	record: Record<string, unknown>
}

// Each kind declares its node's fields (a participant has no ref, a flow node has a note): the shared reader checks them so a stray key is named.
type NodeShape = { scope: BlockScope; keys: readonly string[] }

function parseNode(
	raw: unknown,
	where: string,
	shape: NodeShape,
): Parsed<Node> {
	const node = record(raw, where)
	if (!node.ok) return node
	const keys = onlyKeys(node.value, where, shape.keys)
	if (!keys.ok) return keys
	const { scope } = shape
	const id = identifier(node.value.id, `${where}.id`, GUIDE_LIMITS.idChars)
	if (!id.ok) return id
	const label = text(
		node.value.label,
		`${where}.label`,
		GUIDE_LIMITS.labelChars,
	)
	if (!label.ok) return label
	const ref = parseOptionalRef(node.value.ref, `${where}.ref`, scope)
	if (!ref.ok) return ref
	return {
		ok: true,
		value: {
			id: id.value,
			label: label.value,
			ref: ref.value,
			record: node.value,
		},
	}
}

function parseNodes(
	raw: unknown,
	where: string,
	shape: NodeShape,
): Parsed<{ nodes: Node[]; ids: ReadonlySet<string> }> {
	const nodes = list(raw, where, NODE_BOUNDS, (entry, entryWhere) =>
		parseNode(entry, entryWhere, shape),
	)
	if (!nodes.ok) return nodes
	const ids = nodes.value.map(node => node.id)
	const unique = uniqueIds(ids, where)
	if (!unique.ok) return unique
	return { ok: true, value: { nodes: nodes.value, ids: new Set(ids) } }
}

type StateNode = Extract<ExplanationBlock, { kind: 'state' }>['states'][number]

// A state's own flags on top of the shared node fields.
function parseStateFlags(
	nodes: readonly Node[],
	where: string,
): Parsed<StateNode[]> {
	const states: StateNode[] = []
	for (const [index, node] of nodes.entries()) {
		const nodeWhere = `${where}[${index}]`
		const isInitial = optionalBoolean(
			node.record.isInitial,
			`${nodeWhere}.isInitial`,
		)
		if (!isInitial.ok) return isInitial
		const isFinal = optionalBoolean(
			node.record.isFinal,
			`${nodeWhere}.isFinal`,
		)
		if (!isFinal.ok) return isFinal
		states.push({
			id: node.id,
			label: node.label,
			ref: node.ref,
			isInitial: isInitial.value,
			isFinal: isFinal.value,
		})
	}
	return { ok: true, value: states }
}

export function parseState({
	block,
	where,
	scope,
	base,
}: BlockInput): Parsed<ExplanationBlock> {
	const declared = parseNodes(block.states, `${where}.states`, {
		scope,
		keys: GUIDE_KEYS.stateNode,
	})
	if (!declared.ok) return declared
	const states = parseStateFlags(declared.value.nodes, `${where}.states`)
	if (!states.ok) return states
	const transitions = parseEdges(
		block.transitions,
		`${where}.transitions`,
		EDGE_BOUNDS,
		{
			scope,
			ids: declared.value.ids,
			isLabelRequired: false,
			keys: GUIDE_KEYS.transition,
		},
	)
	if (!transitions.ok) return transitions
	return {
		ok: true,
		value: {
			...base,
			kind: 'state',
			states: states.value,
			transitions: transitions.value,
		},
	}
}

export function parseSequence({
	block,
	where,
	scope,
	base,
}: BlockInput): Parsed<ExplanationBlock> {
	const declared = parseNodes(block.participants, `${where}.participants`, {
		scope,
		keys: GUIDE_KEYS.participant,
	})
	if (!declared.ok) return declared
	const steps = parseEdges(block.steps, `${where}.steps`, STEP_BOUNDS, {
		scope,
		ids: declared.value.ids,
		isLabelRequired: true,
		keys: GUIDE_KEYS.step,
	})
	if (!steps.ok) return steps
	return {
		ok: true,
		value: {
			...base,
			kind: 'sequence',
			participants: declared.value.nodes.map(node => ({
				id: node.id,
				label: node.label,
			})),
			steps: steps.value.map(step => ({
				from: step.from,
				to: step.to,
				label: step.label ?? '',
				ref: step.ref,
			})),
		},
	}
}

export function parseFlow({
	block,
	where,
	scope,
	base,
}: BlockInput): Parsed<ExplanationBlock> {
	const declared = parseNodes(block.nodes, `${where}.nodes`, {
		scope,
		keys: GUIDE_KEYS.flowNode,
	})
	if (!declared.ok) return declared
	const nodes = []
	for (const [index, node] of declared.value.nodes.entries()) {
		const note = optionalText(
			node.record.note,
			`${where}.nodes[${index}].note`,
			GUIDE_LIMITS.textChars,
		)
		if (!note.ok) return note
		nodes.push({
			id: node.id,
			label: node.label,
			ref: node.ref,
			note: note.value,
		})
	}
	const edges = parseEdges(block.edges, `${where}.edges`, EDGE_BOUNDS, {
		scope,
		ids: declared.value.ids,
		isLabelRequired: false,
		keys: GUIDE_KEYS.flowEdge,
	})
	if (!edges.ok) return edges
	return {
		ok: true,
		value: {
			...base,
			kind: 'flow',
			nodes,
			edges: edges.value.map(edge => ({
				from: edge.from,
				to: edge.to,
				label: edge.label,
			})),
		},
	}
}

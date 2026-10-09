// A diagram's edges: both ends name a declared node, the label is required where the edge IS the message (a sequence step) and optional elsewhere, and a ref resolves through the domain's references.
import {
	fail,
	identifier,
	list,
	optionalText,
	record,
	text,
} from './guide-parse.js'
import { parseOptionalRef } from './guide-refs.js'
import { GUIDE_LIMITS } from './guide-shapes.js'

import type { ListBounds, Parsed } from './guide-parse.js'
import type { BlockScope } from './guide-refs.js'

export const EDGE_BOUNDS: ListBounds = {
	min: 0,
	max: GUIDE_LIMITS.diagramEdges,
}
export const STEP_BOUNDS: ListBounds = {
	min: 1,
	max: GUIDE_LIMITS.diagramEdges,
}

export type Edge = {
	from: string
	to: string
	label: string | undefined
	ref: string | undefined
}

export type EdgeScope = {
	scope: BlockScope
	ids: ReadonlySet<string>
	// A sequence step is nothing without its message; a transition or a flow edge may go unlabelled.
	isLabelRequired: boolean
}

function endpoint(
	raw: unknown,
	where: string,
	ids: ReadonlySet<string>,
): Parsed<string> {
	const id = identifier(raw, where, GUIDE_LIMITS.idChars)
	if (!id.ok) return id
	if (!ids.has(id.value))
		return fail(
			`${where} names "${id.value}", which the block does not declare`,
		)
	return id
}

function parseEdge(
	raw: unknown,
	where: string,
	edgeScope: EdgeScope,
): Parsed<Edge> {
	const edge = record(raw, where)
	if (!edge.ok) return edge
	const from = endpoint(edge.value.from, `${where}.from`, edgeScope.ids)
	if (!from.ok) return from
	const to = endpoint(edge.value.to, `${where}.to`, edgeScope.ids)
	if (!to.ok) return to
	const label = edgeScope.isLabelRequired
		? text(edge.value.label, `${where}.label`, GUIDE_LIMITS.labelChars)
		: optionalText(
				edge.value.label,
				`${where}.label`,
				GUIDE_LIMITS.labelChars,
			)
	if (!label.ok) return label
	const ref = parseOptionalRef(
		edge.value.ref,
		`${where}.ref`,
		edgeScope.scope,
	)
	if (!ref.ok) return ref
	return {
		ok: true,
		value: {
			from: from.value,
			to: to.value,
			label: label.value,
			ref: ref.value,
		},
	}
}

export function parseEdges(
	raw: unknown,
	where: string,
	bounds: ListBounds,
	edgeScope: EdgeScope,
): Parsed<Edge[]> {
	return list(raw, where, bounds, (entry, entryWhere) =>
		parseEdge(entry, entryWhere, edgeScope),
	)
}

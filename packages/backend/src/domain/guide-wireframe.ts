// The wireframe block: a sketched screen as a tree of semantic elements, before and after the change. Bounded in depth and in elements so a sketch stays a sketch.
import { GUIDE_KEYS } from './guide-keys.js'
import {
	fail,
	list,
	oneOf,
	onlyKeys,
	optionalText,
	record,
} from './guide-parse.js'
import { parseOptionalRef } from './guide-refs.js'
import { GUIDE_LIMITS } from './guide-shapes.js'
import {
	WIREFRAME_ELEMENTS,
	WIREFRAME_SURFACES,
} from './guide-structure-shapes.js'
import { parseChange } from './guide-structures.js'

import type { BlockInput } from './guide-blocks.js'
import type { Parsed } from './guide-parse.js'
import type { BlockScope } from './guide-refs.js'
import type { ExplanationBlock } from './guide-shapes.js'
import type { WireframeNode } from './guide-structure-shapes.js'

function parseChildren(
	raw: unknown,
	where: string,
	scope: BlockScope,
	depth: number,
): Parsed<WireframeNode[] | undefined> {
	if (raw === null || typeof raw === 'undefined')
		return { ok: true, value: undefined }
	if (depth >= GUIDE_LIMITS.wireframeDepth)
		return fail(
			`${where} nests deeper than ${GUIDE_LIMITS.wireframeDepth} levels; sketch the screen, not its markup`,
		)
	return list(
		raw,
		where,
		{ min: 0, max: GUIDE_LIMITS.wireframeNodes },
		(entry, at) => parseNode(entry, at, scope, depth + 1),
	)
}

function parseNode(
	raw: unknown,
	where: string,
	scope: BlockScope,
	depth: number,
): Parsed<WireframeNode> {
	const node = record(raw, where)
	if (!node.ok) return node
	const keys = onlyKeys(node.value, where, GUIDE_KEYS.wireframeNode)
	if (!keys.ok) return keys
	const el = oneOf(node.value.el, `${where}.el`, WIREFRAME_ELEMENTS)
	if (!el.ok) return el
	const label = optionalText(
		node.value.label,
		`${where}.label`,
		GUIDE_LIMITS.labelChars,
	)
	if (!label.ok) return label
	const change = parseChange(node.value.change, `${where}.change`)
	if (!change.ok) return change
	const ref = parseOptionalRef(node.value.ref, `${where}.ref`, scope)
	if (!ref.ok) return ref
	const children = parseChildren(
		node.value.children,
		`${where}.children`,
		scope,
		depth,
	)
	if (!children.ok) return children
	return {
		ok: true,
		value: {
			el: el.value,
			label: label.value,
			change: change.value,
			ref: ref.value,
			children: children.value,
		},
	}
}

function countElements(node: WireframeNode): number {
	return (node.children ?? []).reduce(
		(total, child) => total + countElements(child),
		1,
	)
}

// The element budget is the sketch's, not each level's: counted over the whole tree once it parsed.
function parseTree(
	raw: unknown,
	where: string,
	scope: BlockScope,
): Parsed<WireframeNode> {
	const tree = parseNode(raw, where, scope, 1)
	if (!tree.ok) return tree
	const count = countElements(tree.value)
	if (count > GUIDE_LIMITS.wireframeNodes)
		return fail(
			`${where} sketches ${count} elements; at most ${GUIDE_LIMITS.wireframeNodes}`,
		)
	return tree
}

export function parseWireframe({
	block,
	where,
	scope,
	base,
}: BlockInput): Parsed<ExplanationBlock> {
	const surface =
		block.surface === null || typeof block.surface === 'undefined'
			? ({ ok: true, value: undefined } as const)
			: oneOf(block.surface, `${where}.surface`, WIREFRAME_SURFACES)
	if (!surface.ok) return surface
	const before =
		block.before === null || typeof block.before === 'undefined'
			? ({ ok: true, value: undefined } as const)
			: parseTree(block.before, `${where}.before`, scope)
	if (!before.ok) return before
	const after = parseTree(block.after, `${where}.after`, scope)
	if (!after.ok) return after
	return {
		ok: true,
		value: {
			...base,
			kind: 'wireframe',
			surface: surface.value,
			before: before.value,
			after: after.value,
		},
	}
}

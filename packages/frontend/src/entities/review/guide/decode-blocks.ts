import {
	assertObject,
	enumValue,
	optBoolean,
	optString,
	requiredArray,
	requiredString,
} from '@shared/api/decode'

import { optStrings } from './decode-fields'

import type {
	BeforeAfterSide,
	ExplanationBlock,
	FlowBlock,
	SequenceBlock,
	StateBlock,
} from './model'

type Ctx = { endpoint: string }

const BLOCK_KINDS = [
	'prose',
	'before-after',
	'state',
	'sequence',
	'flow',
] as const

type BlockBase = Pick<ExplanationBlock, 'id' | 'title' | 'refs' | 'detail'>

function decodeSide(raw: unknown, ctx: Ctx): BeforeAfterSide {
	const o = assertObject(raw, ctx.endpoint, 'before-after side')
	return {
		label: optString(o, 'label', ctx.endpoint),
		markdown: requiredString(o, 'markdown', ctx.endpoint),
		ref: optString(o, 'ref', ctx.endpoint),
	}
}

type Node = { id: string; label: string; ref?: string | undefined }

function decodeNode(
	raw: unknown,
	ctx: Ctx,
	what: string,
): Node & { record: Record<string, unknown> } {
	const o = assertObject(raw, ctx.endpoint, what)
	return {
		id: requiredString(o, 'id', ctx.endpoint),
		label: requiredString(o, 'label', ctx.endpoint),
		ref: optString(o, 'ref', ctx.endpoint),
		record: o,
	}
}

type Edge = {
	from: string
	to: string
	label?: string | undefined
	ref?: string | undefined
}

function decodeEdge(raw: unknown, ctx: Ctx, what: string): Edge {
	const o = assertObject(raw, ctx.endpoint, what)
	return {
		from: requiredString(o, 'from', ctx.endpoint),
		to: requiredString(o, 'to', ctx.endpoint),
		label: optString(o, 'label', ctx.endpoint),
		ref: optString(o, 'ref', ctx.endpoint),
	}
}

function decodeState(
	o: Record<string, unknown>,
	ctx: Ctx,
	base: BlockBase,
): StateBlock {
	return {
		...base,
		kind: 'state',
		states: requiredArray(o, 'states', ctx.endpoint).map(entry => {
			const node = decodeNode(entry, ctx, 'state')
			return {
				id: node.id,
				label: node.label,
				ref: node.ref,
				isInitial: optBoolean(node.record, 'isInitial', ctx.endpoint),
				isFinal: optBoolean(node.record, 'isFinal', ctx.endpoint),
			}
		}),
		transitions: requiredArray(o, 'transitions', ctx.endpoint).map(entry =>
			decodeEdge(entry, ctx, 'transition'),
		),
	}
}

function decodeSequence(
	o: Record<string, unknown>,
	ctx: Ctx,
	base: BlockBase,
): SequenceBlock {
	return {
		...base,
		kind: 'sequence',
		participants: requiredArray(o, 'participants', ctx.endpoint).map(
			entry => {
				const node = decodeNode(entry, ctx, 'participant')
				return { id: node.id, label: node.label }
			},
		),
		steps: requiredArray(o, 'steps', ctx.endpoint).map(entry => {
			const step = decodeEdge(entry, ctx, 'step')
			return {
				from: step.from,
				to: step.to,
				label: step.label ?? '',
				ref: step.ref,
			}
		}),
	}
}

function decodeFlow(
	o: Record<string, unknown>,
	ctx: Ctx,
	base: BlockBase,
): FlowBlock {
	return {
		...base,
		kind: 'flow',
		nodes: requiredArray(o, 'nodes', ctx.endpoint).map(entry => {
			const node = decodeNode(entry, ctx, 'flow node')
			return {
				id: node.id,
				label: node.label,
				ref: node.ref,
				note: optString(node.record, 'note', ctx.endpoint),
			}
		}),
		edges: requiredArray(o, 'edges', ctx.endpoint).map(entry => {
			const edge = decodeEdge(entry, ctx, 'flow edge')
			return { from: edge.from, to: edge.to, label: edge.label }
		}),
	}
}

function decodeProse(
	o: Record<string, unknown>,
	ctx: Ctx,
	base: BlockBase,
): ExplanationBlock {
	return {
		...base,
		kind: 'prose',
		markdown: requiredString(o, 'markdown', ctx.endpoint),
	}
}

function decodeBeforeAfter(
	o: Record<string, unknown>,
	ctx: Ctx,
	base: BlockBase,
): ExplanationBlock {
	return {
		...base,
		kind: 'before-after',
		before: decodeSide(o.before, ctx),
		after: decodeSide(o.after, ctx),
	}
}

type BlockDecoder = (
	o: Record<string, unknown>,
	ctx: Ctx,
	base: BlockBase,
) => ExplanationBlock

// One decoder per kind: a new block kind is an entry here plus its decoder, never another branch.
const DECODERS: Record<(typeof BLOCK_KINDS)[number], BlockDecoder> = {
	prose: decodeProse,
	'before-after': decodeBeforeAfter,
	state: decodeState,
	sequence: decodeSequence,
	flow: decodeFlow,
}

export function decodeBlock(raw: unknown, ctx: Ctx): ExplanationBlock {
	const o = assertObject(raw, ctx.endpoint, 'explanation block')
	const base: BlockBase = {
		id: requiredString(o, 'id', ctx.endpoint),
		title: optString(o, 'title', ctx.endpoint),
		refs: optStrings(o, 'refs', ctx),
		detail: optString(o, 'detail', ctx.endpoint),
	}
	const kind = enumValue(
		o.kind,
		ctx.endpoint,
		BLOCK_KINDS,
		'explanation block.kind',
	)
	return DECODERS[kind](o, ctx, base)
}

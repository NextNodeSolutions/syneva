import { parseFlow, parseSequence, parseState } from './guide-diagrams.js'
import { GUIDE_KEYS } from './guide-keys.js'
import {
	identifier,
	oneOf,
	onlyKeys,
	optionalText,
	record,
	text,
} from './guide-parse.js'
import { parseOptionalRef, parseRefIds } from './guide-refs.js'
import { GUIDE_LIMITS } from './guide-shapes.js'

import type { Parsed } from './guide-parse.js'
import type { BlockBase, BlockScope } from './guide-refs.js'
import type { BeforeAfterSide, ExplanationBlock } from './guide-shapes.js'

// Every explanation block kind the desk renders; an unknown kind is refused by name so an agent learns the vocabulary from the error.
const BLOCK_KINDS = [
	'prose',
	'before-after',
	'state',
	'sequence',
	'flow',
] as const

// One block as the kind parsers see it: the raw record, its field name, the domain's reference scope and the common fields already read.
export type BlockInput = {
	block: Record<string, unknown>
	where: string
	scope: BlockScope
	base: BlockBase
}

export function parseBlock(
	raw: unknown,
	where: string,
	scope: BlockScope,
): Parsed<ExplanationBlock> {
	const block = record(raw, where)
	if (!block.ok) return block
	const kind = oneOf(block.value.kind, `${where}.kind`, BLOCK_KINDS)
	if (!kind.ok) return kind
	const keys = onlyKeys(block.value, where, [
		...GUIDE_KEYS.block,
		...KIND_KEYS[kind.value],
	])
	if (!keys.ok) return keys
	const base = parseBase(block.value, where, scope)
	if (!base.ok) return base
	return PARSERS[kind.value]({
		block: block.value,
		where,
		scope,
		base: base.value,
	})
}

// The fields each kind adds to the common ones; a block may carry its own kind's fields and no other's.
const KIND_KEYS: Record<(typeof BLOCK_KINDS)[number], readonly string[]> = {
	prose: GUIDE_KEYS.prose,
	'before-after': GUIDE_KEYS.beforeAfter,
	state: GUIDE_KEYS.state,
	sequence: GUIDE_KEYS.sequence,
	flow: GUIDE_KEYS.flow,
}

type BlockParser = (input: BlockInput) => Parsed<ExplanationBlock>

// One parser per kind: a new block kind is an entry here plus its parser, never another branch.
const PARSERS: Record<(typeof BLOCK_KINDS)[number], BlockParser> = {
	prose: parseProse,
	'before-after': parseBeforeAfter,
	state: parseState,
	sequence: parseSequence,
	flow: parseFlow,
}

function parseBase(
	block: Record<string, unknown>,
	where: string,
	scope: BlockScope,
): Parsed<BlockBase> {
	const id = identifier(block.id, `${where}.id`, GUIDE_LIMITS.idChars)
	if (!id.ok) return id
	const title = optionalText(
		block.title,
		`${where}.title`,
		GUIDE_LIMITS.labelChars,
	)
	if (!title.ok) return title
	const refs = parseRefIds(block.refs, `${where}.refs`, scope)
	if (!refs.ok) return refs
	const detail = optionalText(
		block.detail,
		`${where}.detail`,
		GUIDE_LIMITS.markdownChars,
	)
	if (!detail.ok) return detail
	return {
		ok: true,
		value: {
			id: id.value,
			title: title.value,
			refs: refs.value,
			detail: detail.value,
		},
	}
}

function parseProse({
	block,
	where,
	base,
}: BlockInput): Parsed<ExplanationBlock> {
	const markdown = text(
		block.markdown,
		`${where}.markdown`,
		GUIDE_LIMITS.markdownChars,
	)
	if (!markdown.ok) return markdown
	return {
		ok: true,
		value: { ...base, kind: 'prose', markdown: markdown.value },
	}
}

function parseSide(
	raw: unknown,
	where: string,
	scope: BlockScope,
): Parsed<BeforeAfterSide> {
	const side = record(raw, where)
	if (!side.ok) return side
	const keys = onlyKeys(side.value, where, GUIDE_KEYS.side)
	if (!keys.ok) return keys
	const label = optionalText(
		side.value.label,
		`${where}.label`,
		GUIDE_LIMITS.labelChars,
	)
	if (!label.ok) return label
	const markdown = text(
		side.value.markdown,
		`${where}.markdown`,
		GUIDE_LIMITS.markdownChars,
	)
	if (!markdown.ok) return markdown
	const ref = parseOptionalRef(side.value.ref, `${where}.ref`, scope)
	if (!ref.ok) return ref
	return {
		ok: true,
		value: { label: label.value, markdown: markdown.value, ref: ref.value },
	}
}

function parseBeforeAfter({
	block,
	where,
	scope,
	base,
}: BlockInput): Parsed<ExplanationBlock> {
	const before = parseSide(block.before, `${where}.before`, scope)
	if (!before.ok) return before
	const after = parseSide(block.after, `${where}.after`, scope)
	if (!after.ok) return after
	return {
		ok: true,
		value: {
			...base,
			kind: 'before-after',
			before: before.value,
			after: after.value,
		},
	}
}

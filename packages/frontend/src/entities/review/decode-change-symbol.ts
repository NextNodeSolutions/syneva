import {
	assertObject,
	enumValue,
	optEnum,
	optional,
	requiredNumber,
	requiredString,
} from '@shared/api/decode'

import type { ChangeSymbol, ChangeTrivia, LineRange } from './model'

const SYMBOL_KINDS = [
	'function',
	'class',
	'method',
	'interface',
	'type',
	'enum',
	'variable',
	'call',
	'section',
] as const
const TRIVIA = ['comment', 'import'] as const

function decodeRange(raw: unknown, endpoint: string): LineRange {
	const o = assertObject(raw, endpoint, 'change.symbol range')
	return {
		startLine: requiredNumber(o, 'startLine', endpoint),
		endLine: requiredNumber(o, 'endLine', endpoint),
	}
}

export function decodeChangeSymbol(
	raw: unknown,
	endpoint: string,
): ChangeSymbol {
	const o = assertObject(raw, endpoint, 'change.symbol')
	return {
		name: requiredString(o, 'name', endpoint),
		kind: enumValue(o.kind, endpoint, SYMBOL_KINDS, 'change.symbol.kind'),
		before: optional(o, 'before', endpoint, rawRange =>
			decodeRange(rawRange, endpoint),
		),
		after: optional(o, 'after', endpoint, rawRange =>
			decodeRange(rawRange, endpoint),
		),
	}
}

export function decodeChangeTrivia(
	o: Record<string, unknown>,
	endpoint: string,
): ChangeTrivia | undefined {
	return optEnum(o, 'trivia', endpoint, TRIVIA)
}

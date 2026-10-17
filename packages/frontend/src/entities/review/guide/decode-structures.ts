import {
	assertObject,
	enumValue,
	optString,
	requiredArray,
	requiredString,
} from '@shared/api/decode'
import { CARDINALITIES, CHANGE_MARKS } from '@syneva/contracts/guide-structures'

import type {
	ChangeMark,
	DataField,
	DataModelBlock,
	ExplanationBlock,
} from './model'

// The structural blocks' wire shapes onto the entity model: the data model. The hub validated them; this checks types and names.

type Ctx = { endpoint: string }
type BlockBase = Pick<ExplanationBlock, 'id' | 'title' | 'refs' | 'detail'>

function optEnum<T extends string>(
	o: Record<string, unknown>,
	key: string,
	ctx: Ctx,
	allowed: readonly T[],
): T | undefined {
	if (o[key] === null || typeof o[key] === 'undefined') return undefined
	return enumValue(o[key], ctx.endpoint, allowed, key)
}

function optChange(
	o: Record<string, unknown>,
	ctx: Ctx,
): ChangeMark | undefined {
	return optEnum(o, 'change', ctx, CHANGE_MARKS)
}

function decodeField(raw: unknown, ctx: Ctx): DataField {
	const o = assertObject(raw, ctx.endpoint, 'field')
	return {
		name: requiredString(o, 'name', ctx.endpoint),
		type: optString(o, 'type', ctx.endpoint),
		change: optChange(o, ctx),
		note: optString(o, 'note', ctx.endpoint),
		ref: optString(o, 'ref', ctx.endpoint),
	}
}

export function decodeDataModel(
	o: Record<string, unknown>,
	ctx: Ctx,
	base: BlockBase,
): DataModelBlock {
	return {
		...base,
		kind: 'data-model',
		entities: requiredArray(o, 'entities', ctx.endpoint).map(entry => {
			const entity = assertObject(entry, ctx.endpoint, 'entity')
			return {
				id: requiredString(entity, 'id', ctx.endpoint),
				label: requiredString(entity, 'label', ctx.endpoint),
				ref: optString(entity, 'ref', ctx.endpoint),
				change: optChange(entity, ctx),
				fields: requiredArray(entity, 'fields', ctx.endpoint).map(
					field => decodeField(field, ctx),
				),
			}
		}),
		relations: requiredArray(o, 'relations', ctx.endpoint).map(entry => {
			const relation = assertObject(entry, ctx.endpoint, 'relation')
			return {
				from: requiredString(relation, 'from', ctx.endpoint),
				to: requiredString(relation, 'to', ctx.endpoint),
				label: optString(relation, 'label', ctx.endpoint),
				cardinality: optEnum(
					relation,
					'cardinality',
					ctx,
					CARDINALITIES,
				),
				change: optChange(relation, ctx),
			}
		}),
	}
}

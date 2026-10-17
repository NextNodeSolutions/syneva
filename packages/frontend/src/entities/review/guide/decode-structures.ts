import {
	assertObject,
	enumValue,
	optString,
	requiredArray,
	requiredString,
} from '@shared/api/decode'
import {
	API_METHODS,
	CARDINALITIES,
	CHANGE_MARKS,
	WIREFRAME_ELEMENTS,
	WIREFRAME_SURFACES,
} from '@syneva/contracts/guide-structures'

import { optList } from './decode-fields'

import type {
	ApiBlock,
	ApiEndpoint,
	ChangeMark,
	DataField,
	DataModelBlock,
	ExplanationBlock,
	WireframeBlock,
	WireframeNode,
} from './model'

// The structural blocks' wire shapes onto the entity model: the data model, the API and the wireframe. The hub validated them; this checks types and names.

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

function decodeEndpoint(raw: unknown, ctx: Ctx): ApiEndpoint {
	const o = assertObject(raw, ctx.endpoint, 'endpoint')
	return {
		id: requiredString(o, 'id', ctx.endpoint),
		method: enumValue(
			o.method,
			ctx.endpoint,
			API_METHODS,
			'endpoint.method',
		),
		path: requiredString(o, 'path', ctx.endpoint),
		summary: optString(o, 'summary', ctx.endpoint),
		change: optChange(o, ctx),
		ref: optString(o, 'ref', ctx.endpoint),
		request: optList(o, 'request', ctx, field => decodeField(field, ctx)),
		response: optList(o, 'response', ctx, field => decodeField(field, ctx)),
	}
}

export function decodeApi(
	o: Record<string, unknown>,
	ctx: Ctx,
	base: BlockBase,
): ApiBlock {
	return {
		...base,
		kind: 'api',
		endpoints: requiredArray(o, 'endpoints', ctx.endpoint).map(entry =>
			decodeEndpoint(entry, ctx),
		),
	}
}

function decodeWireframeNode(raw: unknown, ctx: Ctx): WireframeNode {
	const o = assertObject(raw, ctx.endpoint, 'wireframe element')
	return {
		el: enumValue(o.el, ctx.endpoint, WIREFRAME_ELEMENTS, 'wireframe.el'),
		label: optString(o, 'label', ctx.endpoint),
		change: optChange(o, ctx),
		ref: optString(o, 'ref', ctx.endpoint),
		children: optList(o, 'children', ctx, child =>
			decodeWireframeNode(child, ctx),
		),
	}
}

// Left out, a wireframe has no before (a new screen).
function optWireframe(raw: unknown, ctx: Ctx): WireframeNode | undefined {
	if (raw === null || typeof raw === 'undefined') return undefined
	return decodeWireframeNode(raw, ctx)
}

export function decodeWireframe(
	o: Record<string, unknown>,
	ctx: Ctx,
	base: BlockBase,
): WireframeBlock {
	return {
		...base,
		kind: 'wireframe',
		surface: optEnum(o, 'surface', ctx, WIREFRAME_SURFACES),
		before: optWireframe(o.before, ctx),
		after: decodeWireframeNode(o.after, ctx),
	}
}

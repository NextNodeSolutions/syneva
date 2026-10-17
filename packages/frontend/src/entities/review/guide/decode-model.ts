import {
	assertObject,
	enumValue,
	optString,
	requiredArray,
	requiredString,
} from '@shared/api/decode'
import { MODEL_ELEMENT_KINDS } from '@syneva/contracts/guide-model'
import { CHANGE_MARKS } from '@syneva/contracts/guide-structures'

import { optList, optStrings } from './decode-fields'

import type { ChangeMark } from './model'
import type {
	GuideModel,
	ModelElement,
	ModelRelation,
	ModelStep,
	ModelView,
} from './system-model'

// The system model's wire shape onto the entity model. The hub validated it (every end declared, nesting acyclic); this checks types and names.

type Ctx = { endpoint: string }

function optChange(
	o: Record<string, unknown>,
	ctx: Ctx,
): ChangeMark | undefined {
	if (o.change === null || typeof o.change === 'undefined') return undefined
	return enumValue(o.change, ctx.endpoint, CHANGE_MARKS, 'change')
}

function decodeElement(raw: unknown, ctx: Ctx): ModelElement {
	const o = assertObject(raw, ctx.endpoint, 'model element')
	return {
		id: requiredString(o, 'id', ctx.endpoint),
		kind: enumValue(
			o.kind,
			ctx.endpoint,
			MODEL_ELEMENT_KINDS,
			'model element.kind',
		),
		label: requiredString(o, 'label', ctx.endpoint),
		description: optString(o, 'description', ctx.endpoint),
		technology: optString(o, 'technology', ctx.endpoint),
		parent: optString(o, 'parent', ctx.endpoint),
		change: optChange(o, ctx),
		domains: optStrings(o, 'domains', ctx),
	}
}

function decodeRelation(raw: unknown, ctx: Ctx): ModelRelation {
	const o = assertObject(raw, ctx.endpoint, 'model relation')
	return {
		from: requiredString(o, 'from', ctx.endpoint),
		to: requiredString(o, 'to', ctx.endpoint),
		label: optString(o, 'label', ctx.endpoint),
		technology: optString(o, 'technology', ctx.endpoint),
		change: optChange(o, ctx),
	}
}

function decodeStep(raw: unknown, ctx: Ctx): ModelStep {
	const o = assertObject(raw, ctx.endpoint, 'model step')
	return {
		from: requiredString(o, 'from', ctx.endpoint),
		to: requiredString(o, 'to', ctx.endpoint),
		label: requiredString(o, 'label', ctx.endpoint),
		change: optChange(o, ctx),
	}
}

function decodeView(raw: unknown, ctx: Ctx): ModelView {
	const o = assertObject(raw, ctx.endpoint, 'model view')
	return {
		id: requiredString(o, 'id', ctx.endpoint),
		title: requiredString(o, 'title', ctx.endpoint),
		description: optString(o, 'description', ctx.endpoint),
		domains: optStrings(o, 'domains', ctx),
		steps: requiredArray(o, 'steps', ctx.endpoint).map(entry =>
			decodeStep(entry, ctx),
		),
	}
}

export function decodeModel(raw: unknown, ctx: Ctx): GuideModel | undefined {
	if (raw === null || typeof raw === 'undefined') return undefined
	const o = assertObject(raw, ctx.endpoint, 'guide model')
	return {
		elements: requiredArray(o, 'elements', ctx.endpoint).map(entry =>
			decodeElement(entry, ctx),
		),
		relations: requiredArray(o, 'relations', ctx.endpoint).map(entry =>
			decodeRelation(entry, ctx),
		),
		views: optList(o, 'views', ctx, entry => decodeView(entry, ctx)),
	}
}

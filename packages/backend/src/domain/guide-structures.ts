// The two structural blocks: a data model (entities, their fields, the relations between them) and an API (its entry points and their messages). Each element says what the change does to it, so the reviewer reads the change off the drawing.
import { parseEdge } from './guide-diagram-edges.js'
import { GUIDE_KEYS } from './guide-keys.js'
import {
	identifier,
	list,
	oneOf,
	onlyKeys,
	optionalList,
	optionalText,
	record,
	text,
	uniqueIds,
} from './guide-parse.js'
import { parseOptionalRef } from './guide-refs.js'
import { GUIDE_LIMITS } from './guide-shapes.js'
import { CARDINALITIES, CHANGE_MARKS } from './guide-structure-shapes.js'

import type { BlockInput } from './guide-blocks.js'
import type { EdgeScope } from './guide-diagram-edges.js'
import type { Parsed } from './guide-parse.js'
import type { BlockScope } from './guide-refs.js'
import type { ExplanationBlock } from './guide-shapes.js'
import type {
	ChangeMark,
	DataEntity,
	DataField,
	DataRelation,
} from './guide-structure-shapes.js'

function optionalOneOf<T extends string>(
	raw: unknown,
	where: string,
	allowed: readonly T[],
): Parsed<T | undefined> {
	if (raw === null || typeof raw === 'undefined')
		return { ok: true, value: undefined }
	return oneOf(raw, where, allowed)
}

export function parseChange(
	raw: unknown,
	where: string,
): Parsed<ChangeMark | undefined> {
	return optionalOneOf(raw, where, CHANGE_MARKS)
}

function parseField(
	raw: unknown,
	where: string,
	scope: BlockScope,
): Parsed<DataField> {
	const field = record(raw, where)
	if (!field.ok) return field
	const keys = onlyKeys(field.value, where, GUIDE_KEYS.field)
	if (!keys.ok) return keys
	const name = text(
		field.value.name,
		`${where}.name`,
		GUIDE_LIMITS.labelChars,
	)
	if (!name.ok) return name
	const type = optionalText(
		field.value.type,
		`${where}.type`,
		GUIDE_LIMITS.labelChars,
	)
	if (!type.ok) return type
	const change = parseChange(field.value.change, `${where}.change`)
	if (!change.ok) return change
	const note = optionalText(
		field.value.note,
		`${where}.note`,
		GUIDE_LIMITS.textChars,
	)
	if (!note.ok) return note
	const ref = parseOptionalRef(field.value.ref, `${where}.ref`, scope)
	if (!ref.ok) return ref
	return {
		ok: true,
		value: {
			name: name.value,
			type: type.value,
			change: change.value,
			note: note.value,
			ref: ref.value,
		},
	}
}

export function parseFields(
	raw: unknown,
	where: string,
	scope: BlockScope,
): Parsed<DataField[] | undefined> {
	return optionalList(raw, where, GUIDE_LIMITS.entityFields, (entry, at) =>
		parseField(entry, at, scope),
	)
}

function parseEntity(
	raw: unknown,
	where: string,
	scope: BlockScope,
): Parsed<DataEntity> {
	const entity = record(raw, where)
	if (!entity.ok) return entity
	const keys = onlyKeys(entity.value, where, GUIDE_KEYS.entity)
	if (!keys.ok) return keys
	const id = identifier(entity.value.id, `${where}.id`, GUIDE_LIMITS.idChars)
	if (!id.ok) return id
	const label = text(
		entity.value.label,
		`${where}.label`,
		GUIDE_LIMITS.labelChars,
	)
	if (!label.ok) return label
	const ref = parseOptionalRef(entity.value.ref, `${where}.ref`, scope)
	if (!ref.ok) return ref
	const change = parseChange(entity.value.change, `${where}.change`)
	if (!change.ok) return change
	const fields = parseFields(entity.value.fields, `${where}.fields`, scope)
	if (!fields.ok) return fields
	return {
		ok: true,
		value: {
			id: id.value,
			label: label.value,
			ref: ref.value,
			change: change.value,
			fields: fields.value ?? [],
		},
	}
}

// A relation's own fields over the shared edge rules (both ends declared): its cardinality and what the change does to it.
function parseRelation(
	raw: unknown,
	where: string,
	edgeScope: EdgeScope,
): Parsed<DataRelation> {
	const edge = parseEdge(raw, where, edgeScope)
	if (!edge.ok) return edge
	const fields = record(raw, where)
	if (!fields.ok) return fields
	const cardinality = optionalOneOf(
		fields.value.cardinality,
		`${where}.cardinality`,
		CARDINALITIES,
	)
	if (!cardinality.ok) return cardinality
	const change = parseChange(fields.value.change, `${where}.change`)
	if (!change.ok) return change
	return {
		ok: true,
		value: {
			from: edge.value.from,
			to: edge.value.to,
			label: edge.value.label,
			cardinality: cardinality.value,
			change: change.value,
		},
	}
}

export function parseDataModel({
	block,
	where,
	scope,
	base,
}: BlockInput): Parsed<ExplanationBlock> {
	const entities = list(
		block.entities,
		`${where}.entities`,
		{ min: 1, max: GUIDE_LIMITS.diagramNodes },
		(entry, at) => parseEntity(entry, at, scope),
	)
	if (!entities.ok) return entities
	const ids = entities.value.map(entity => entity.id)
	const unique = uniqueIds(ids, `${where}.entities`)
	if (!unique.ok) return unique
	const edgeScope: EdgeScope = {
		scope,
		ids: new Set(ids),
		isLabelRequired: false,
		keys: GUIDE_KEYS.relation,
	}
	const relations = optionalList(
		block.relations,
		`${where}.relations`,
		GUIDE_LIMITS.diagramEdges,
		(entry, at) => parseRelation(entry, at, edgeScope),
	)
	if (!relations.ok) return relations
	return {
		ok: true,
		value: {
			...base,
			kind: 'data-model',
			entities: entities.value,
			relations: relations.value ?? [],
		},
	}
}

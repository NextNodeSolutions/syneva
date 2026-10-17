// The system model's reader: its elements (guide-model-elements.ts), then relations and dynamic views whose every end names a declared element. The domains it names are checked against the composed guide (guide-model-links.ts), since a posted guide may name domains the desk keeps.
import { GUIDE_KEYS } from './guide-keys.js'
import {
	ancestorsOf,
	domainIds,
	parseElements,
} from './guide-model-elements.js'
import {
	fail,
	identifier,
	list,
	onlyKeys,
	optionalList,
	optionalText,
	record,
	text,
	uniqueIds,
} from './guide-parse.js'
import { GUIDE_LIMITS } from './guide-shapes.js'
import { parseChange } from './guide-structures.js'

import type {
	GuideModel,
	ModelRelation,
	ModelStep,
	ModelView,
} from './guide-model-shapes.js'
import type { Parsed } from './guide-parse.js'

type Ends = {
	ids: ReadonlySet<string>
	parents: ReadonlyMap<string, string | undefined>
}

function end(raw: unknown, where: string, scope: Ends): Parsed<string> {
	const id = identifier(raw, where, GUIDE_LIMITS.idChars)
	if (!id.ok) return id
	if (!scope.ids.has(id.value))
		return fail(
			`${where} names "${id.value}", which the model does not declare`,
		)
	return id
}

// Both ends declared, and neither holding the other: an element already sits in what contains it, drawing a line between them says nothing.
function linkEnds(
	link: Record<string, unknown>,
	where: string,
	scope: Ends,
): Parsed<{ from: string; to: string }> {
	const from = end(link.from, `${where}.from`, scope)
	if (!from.ok) return from
	const to = end(link.to, `${where}.to`, scope)
	if (!to.ok) return to
	if (
		ancestorsOf(from.value, scope.parents).includes(to.value) ||
		ancestorsOf(to.value, scope.parents).includes(from.value)
	)
		return fail(
			`${where} links "${from.value}" to "${to.value}", one of which contains the other; link the parts that talk`,
		)
	return { ok: true, value: { from: from.value, to: to.value } }
}

function parseRelation(
	raw: unknown,
	where: string,
	scope: Ends,
): Parsed<ModelRelation> {
	const relation = record(raw, where)
	if (!relation.ok) return relation
	const keys = onlyKeys(relation.value, where, GUIDE_KEYS.modelRelation)
	if (!keys.ok) return keys
	const linked = linkEnds(relation.value, where, scope)
	if (!linked.ok) return linked
	const label = optionalText(
		relation.value.label,
		`${where}.label`,
		GUIDE_LIMITS.labelChars,
	)
	if (!label.ok) return label
	const technology = optionalText(
		relation.value.technology,
		`${where}.technology`,
		GUIDE_LIMITS.labelChars,
	)
	if (!technology.ok) return technology
	const change = parseChange(relation.value.change, `${where}.change`)
	if (!change.ok) return change
	return {
		ok: true,
		value: {
			...linked.value,
			label: label.value,
			technology: technology.value,
			change: change.value,
		},
	}
}

function parseStep(
	raw: unknown,
	where: string,
	scope: Ends,
): Parsed<ModelStep> {
	const step = record(raw, where)
	if (!step.ok) return step
	const keys = onlyKeys(step.value, where, GUIDE_KEYS.modelStep)
	if (!keys.ok) return keys
	const linked = linkEnds(step.value, where, scope)
	if (!linked.ok) return linked
	const label = text(
		step.value.label,
		`${where}.label`,
		GUIDE_LIMITS.labelChars,
	)
	if (!label.ok) return label
	const change = parseChange(step.value.change, `${where}.change`)
	if (!change.ok) return change
	return {
		ok: true,
		value: { ...linked.value, label: label.value, change: change.value },
	}
}

function parseView(
	raw: unknown,
	where: string,
	scope: Ends,
): Parsed<ModelView> {
	const view = record(raw, where)
	if (!view.ok) return view
	const keys = onlyKeys(view.value, where, GUIDE_KEYS.modelView)
	if (!keys.ok) return keys
	const id = identifier(view.value.id, `${where}.id`, GUIDE_LIMITS.idChars)
	if (!id.ok) return id
	const title = text(
		view.value.title,
		`${where}.title`,
		GUIDE_LIMITS.labelChars,
	)
	if (!title.ok) return title
	const description = optionalText(
		view.value.description,
		`${where}.description`,
		GUIDE_LIMITS.textChars,
	)
	if (!description.ok) return description
	const domains = domainIds(view.value.domains, `${where}.domains`)
	if (!domains.ok) return domains
	const steps = list(
		view.value.steps,
		`${where}.steps`,
		{ min: 1, max: GUIDE_LIMITS.viewSteps },
		(entry, at) => parseStep(entry, at, scope),
	)
	if (!steps.ok) return steps
	return {
		ok: true,
		value: {
			id: id.value,
			title: title.value,
			description: description.value,
			domains: domains.value,
			steps: steps.value,
		},
	}
}

// Absent stays absent: a posted guide without a model keeps the desk's.
export function parseModel(raw: unknown): Parsed<GuideModel | undefined> {
	if (raw === null || typeof raw === 'undefined')
		return { ok: true, value: undefined }
	const where = 'guide.model'
	const model = record(raw, where)
	if (!model.ok) return model
	const keys = onlyKeys(model.value, where, GUIDE_KEYS.model)
	if (!keys.ok) return keys
	const elements = parseElements(model.value.elements, `${where}.elements`)
	if (!elements.ok) return elements
	const scope: Ends = {
		ids: new Set(elements.value.map(element => element.id)),
		parents: new Map(
			elements.value.map(element => [element.id, element.parent]),
		),
	}
	const relations = optionalList(
		model.value.relations,
		`${where}.relations`,
		GUIDE_LIMITS.modelRelations,
		(entry, at) => parseRelation(entry, at, scope),
	)
	if (!relations.ok) return relations
	const views = optionalList(
		model.value.views,
		`${where}.views`,
		GUIDE_LIMITS.modelViews,
		(entry, at) => parseView(entry, at, scope),
	)
	if (!views.ok) return views
	const unique = uniqueIds(
		(views.value ?? []).map(view => view.id),
		`${where}.views`,
	)
	if (!unique.ok) return unique
	return {
		ok: true,
		value: {
			elements: elements.value,
			relations: relations.value ?? [],
			views: views.value,
		},
	}
}

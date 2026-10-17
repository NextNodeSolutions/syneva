// The model's elements: each declared once, of a known kind, nested inside a declared parent no deeper than the limit and never inside itself.
import { GUIDE_KEYS } from './guide-keys.js'
import { MODEL_ELEMENT_KINDS } from './guide-model-shapes.js'
import {
	fail,
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
import { GUIDE_LIMITS } from './guide-shapes.js'
import { parseChange } from './guide-structures.js'

import type { ModelElement } from './guide-model-shapes.js'
import type { Parsed } from './guide-parse.js'

export function domainIds(
	raw: unknown,
	where: string,
): Parsed<string[] | undefined> {
	return optionalList(raw, where, GUIDE_LIMITS.domains, (entry, at) =>
		identifier(entry, at, GUIDE_LIMITS.idChars),
	)
}

function parseElement(raw: unknown, where: string): Parsed<ModelElement> {
	const element = record(raw, where)
	if (!element.ok) return element
	const keys = onlyKeys(element.value, where, GUIDE_KEYS.modelElement)
	if (!keys.ok) return keys
	const fields = element.value
	const id = identifier(fields.id, `${where}.id`, GUIDE_LIMITS.idChars)
	if (!id.ok) return id
	const kind = oneOf(fields.kind, `${where}.kind`, MODEL_ELEMENT_KINDS)
	if (!kind.ok) return kind
	const label = text(fields.label, `${where}.label`, GUIDE_LIMITS.labelChars)
	if (!label.ok) return label
	const description = optionalText(
		fields.description,
		`${where}.description`,
		GUIDE_LIMITS.textChars,
	)
	if (!description.ok) return description
	const technology = optionalText(
		fields.technology,
		`${where}.technology`,
		GUIDE_LIMITS.labelChars,
	)
	if (!technology.ok) return technology
	const parent = optionalText(
		fields.parent,
		`${where}.parent`,
		GUIDE_LIMITS.idChars,
	)
	if (!parent.ok) return parent
	const change = parseChange(fields.change, `${where}.change`)
	if (!change.ok) return change
	const domains = domainIds(fields.domains, `${where}.domains`)
	if (!domains.ok) return domains
	return {
		ok: true,
		value: {
			id: id.value,
			kind: kind.value,
			label: label.value,
			description: description.value,
			technology: technology.value,
			parent: parent.value,
			change: change.value,
			domains: domains.value,
		},
	}
}

// The chain of elements holding `id`, nearest first; a parent that leads back to the element is a cycle and stops the walk.
export function ancestorsOf(
	id: string,
	parents: ReadonlyMap<string, string | undefined>,
): string[] {
	const chain: string[] = []
	let parent = parents.get(id)
	while (parent && !chain.includes(parent) && parent !== id) {
		chain.push(parent)
		parent = parents.get(parent)
	}
	return chain
}

function checkNesting(elements: readonly ModelElement[]): Parsed<true> {
	const parents = new Map(
		elements.map(element => [element.id, element.parent]),
	)
	for (const [index, element] of elements.entries()) {
		const where = `guide.model.elements[${index}].parent`
		const { parent } = element
		if (!parent) continue
		if (parent === element.id)
			return fail(`${where} names the element itself`)
		if (!parents.has(parent))
			return fail(
				`${where} names "${parent}", which the model does not declare`,
			)
		const chain = ancestorsOf(element.id, parents)
		if (parents.get(chain.at(-1) ?? '') === element.id)
			return fail(`${where} makes "${element.id}" sit inside itself`)
		if (chain.length >= GUIDE_LIMITS.modelDepth)
			return fail(
				`${where} nests "${element.id}" ${chain.length + 1} deep; at most ${GUIDE_LIMITS.modelDepth}`,
			)
	}
	return { ok: true, value: true }
}

export function parseElements(
	raw: unknown,
	where: string,
): Parsed<ModelElement[]> {
	const elements = list(
		raw,
		where,
		{ min: 1, max: GUIDE_LIMITS.modelElements },
		parseElement,
	)
	if (!elements.ok) return elements
	const unique = uniqueIds(
		elements.value.map(element => element.id),
		where,
	)
	if (!unique.ok) return unique
	const nesting = checkNesting(elements.value)
	if (!nesting.ok) return nesting
	return elements
}

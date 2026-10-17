// The domains a model names, checked against the guide it hangs on: a stored guide refuses a stranger, a posted model reports it as an issue, and a model the desk keeps across a post drops the domains no longer in the guide.
import { indexed } from './guide-parse.js'

import type { GuideModel } from './guide-model-shapes.js'
import type { GuideIssue } from './guide-shapes.js'

type Named = { id: string; field: string }

function namedDomains(model: GuideModel): Named[] {
	return [
		...model.elements.flatMap((element, index) =>
			(element.domains ?? []).map((id, position) => ({
				id,
				field: indexed(
					`${indexed('guide.model.elements', index)}.domains`,
					position,
				),
			})),
		),
		...(model.views ?? []).flatMap((view, index) =>
			(view.domains ?? []).map((id, position) => ({
				id,
				field: indexed(
					`${indexed('guide.model.views', index)}.domains`,
					position,
				),
			})),
		),
	]
}

export function modelLinkIssues(
	model: GuideModel | undefined,
	ids: ReadonlySet<string>,
): GuideIssue[] {
	if (!model) return []
	return namedDomains(model)
		.filter(named => !ids.has(named.id))
		.map(({ id, field }) => ({
			field,
			target: id,
			// The field leads wherever an issue is printed, so the reason starts after it.
			reason: `names "${id}", which is not a domain of the guide`,
		}))
}

export function prunedModel(
	model: GuideModel | undefined,
	ids: ReadonlySet<string>,
): GuideModel | undefined {
	if (!model) return undefined
	return {
		...model,
		elements: model.elements.map(element => ({
			...element,
			domains: element.domains?.filter(id => ids.has(id)),
		})),
		views: model.views?.map(view => ({
			...view,
			domains: view.domains?.filter(id => ids.has(id)),
		})),
	}
}

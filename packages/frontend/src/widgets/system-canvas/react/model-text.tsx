import { CHANGE_WORDS } from '@shared/ui/change-mark.styles'
import * as stylex from '@stylexjs/stylex'

import { canvas } from './canvas.styles'
import { KIND_WORDS } from './kind-glyph'

import type {
	GuideModel,
	ModelElement,
} from '@entities/review/guide/system-model'
import type { ReactElement } from 'react'
import type { CanvasDomain } from '../model'

function elementLine(
	element: ModelElement,
	parents: ReadonlyMap<string, string>,
	numbers: ReadonlyMap<string, number>,
): string {
	const domains = (element.domains ?? []).flatMap(id => numbers.get(id) ?? [])
	const what = [
		KIND_WORDS[element.kind],
		element.technology,
		element.parent && `in ${parents.get(element.parent) ?? element.parent}`,
		element.change && CHANGE_WORDS[element.change],
		domains.length &&
			`${domains.length > 1 ? 'domains' : 'domain'} ${domains.join(', ')}`,
	]
		.filter(Boolean)
		.join(', ')
	const description = element.description ? `: ${element.description}` : ''
	return `${element.label} (${what})${description}`
}

// The model as sentences, every part then every link: what a screen reader and a reviewer without the drawing read, and what stays when the drawing fails.
export function ModelText({
	model,
	domains,
	isOpen = false,
}: {
	model: GuideModel
	domains: readonly CanvasDomain[]
	isOpen?: boolean
}): ReactElement {
	const labels = new Map(
		model.elements.map(element => [element.id, element.label]),
	)
	const numbers = new Map(domains.map(domain => [domain.id, domain.number]))
	const lines = [
		...model.elements.map(element => ({
			key: `e:${element.id}`,
			text: elementLine(element, labels, numbers),
		})),
		...model.relations.map((relation, index) => ({
			key: `r:${String(index)}`,
			text: `${labels.get(relation.from) ?? relation.from} → ${labels.get(relation.to) ?? relation.to}${relation.label ? `: ${relation.label}` : ''}${relation.change ? ` (${CHANGE_WORDS[relation.change]})` : ''}`,
		})),
	]
	return (
		<details {...stylex.props(canvas.text)} open={isOpen || undefined}>
			<summary {...stylex.props(canvas.textSummary)}>As text</summary>
			<ol {...stylex.props(canvas.textList)}>
				{lines.map(line => (
					<li key={line.key}>{line.text}</li>
				))}
			</ol>
		</details>
	)
}

import { RISK_LABELS } from '@shared/ui/risk-tag-html'
import * as stylex from '@stylexjs/stylex'

import { useCanvasActions } from './canvas-actions'
import { numbers } from './numbers.styles'

import type { StaticStyle } from '@shared/lib/cx'
import type { MouseEvent, ReactElement } from 'react'
import type { CanvasDomain } from '../model'

export function domainTitle(domain: CanvasDomain): string {
	const toRead = domain.toRead
		? `, ${domain.toRead} to read line by line`
		: ''
	return `Domain ${domain.number}: ${domain.title} (${RISK_LABELS[domain.risk]} risk${toRead}). Open its review.`
}

// The domains that change a part, by their number in the reading order: the way down from the map to the code. Ink on white like a reference mark, so the change's colour stays the only strong one on the drawing (the risk is in the title and the inspector). Pointing at a number lights its domain's parts, choosing it opens the domain. The pointer's shortcut only: the keyboard reaches the same domains through the inspector's chips, so a number never nests a second control inside the part's own.
export function DomainNumbers({
	domains,
	css,
}: {
	domains: readonly CanvasDomain[]
	css?: StaticStyle
}): ReactElement | null {
	const actions = useCanvasActions()
	if (!domains.length) return null
	const open = (event: MouseEvent, id: string): void => {
		event.stopPropagation()
		actions.onOpen(id)
	}
	return (
		<span {...stylex.props(numbers.row, css)}>
			{domains.map(domain => (
				<button
					key={domain.id}
					type="button"
					tabIndex={-1}
					aria-hidden="true"
					title={domainTitle(domain)}
					onClick={event => open(event, domain.id)}
					onMouseEnter={() => actions.onFocus(domain.id)}
					onMouseLeave={() => actions.onFocus(null)}
					{...stylex.props(numbers.number)}
				>
					{domain.number}
				</button>
			))}
		</span>
	)
}

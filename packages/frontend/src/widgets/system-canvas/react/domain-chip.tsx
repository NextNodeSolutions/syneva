import { RISK_LABELS } from '@shared/ui/risk-tag-html'
import { riskTag } from '@shared/ui/risk-tag.styles'
import * as stylex from '@stylexjs/stylex'
import { tag } from '@syneva/design-system/controls.styles'

import { canvas } from './canvas.styles'

import type { ReactElement } from 'react'
import type { CanvasDomain } from '../model'

export type DomainActions = {
	onFocus: (id: string | null) => void
	onOpen: (id: string) => void
}

// A domain the canvas names: pointing at it lights its parts, choosing it opens its review (the explained level, domain by domain).
export function DomainChip({
	domain,
	actions,
}: {
	domain: CanvasDomain
	actions: DomainActions
}): ReactElement {
	return (
		<button
			type="button"
			title={`Review ${domain.title}`}
			onClick={() => actions.onOpen(domain.id)}
			onMouseEnter={() => actions.onFocus(domain.id)}
			onMouseLeave={() => actions.onFocus(null)}
			onFocus={() => actions.onFocus(domain.id)}
			onBlur={() => actions.onFocus(null)}
			{...stylex.props(canvas.chip)}
		>
			<span
				aria-label={`${RISK_LABELS[domain.risk]} risk`}
				{...stylex.props(tag.base, riskTag[domain.risk])}
			>
				{domain.number}
			</span>
			<span {...stylex.props(canvas.chipTitle)}>{domain.title}</span>
			<span {...stylex.props(canvas.caption)}>
				{domain.decided}/{domain.total}
			</span>
			{domain.toRead > 0 && (
				<span {...stylex.props(tag.base, tag.red)}>
					{domain.toRead} to read
				</span>
			)}
			{domain.isStale && (
				<span {...stylex.props(tag.base, tag.amber)}>Stale</span>
			)}
		</button>
	)
}

export function DomainChips({
	domains,
	actions,
}: {
	domains: readonly CanvasDomain[]
	actions: DomainActions
}): ReactElement | null {
	if (!domains.length) return null
	return (
		<span {...stylex.props(canvas.chips)}>
			{domains.map(domain => (
				<DomainChip key={domain.id} domain={domain} actions={actions} />
			))}
		</span>
	)
}

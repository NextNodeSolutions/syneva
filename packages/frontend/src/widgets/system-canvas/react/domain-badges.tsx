import { RISK_LABELS } from '@shared/ui/risk-tag-html'
import { riskTag } from '@shared/ui/risk-tag.styles'
import * as stylex from '@stylexjs/stylex'
import { tag } from '@syneva/design-system/controls.styles'

import { node } from './node.styles'

import type { StaticStyle } from '@shared/lib/cx'
import type { ReactElement } from 'react'
import type { CanvasDomain } from '../model'

// The domains that change an element, by their number in the reading order and tinted by their risk; one with spans left to read line by line is underlined in red.
export function DomainBadges({
	domains,
	css,
}: {
	domains: readonly CanvasDomain[]
	css?: StaticStyle
}): ReactElement | null {
	if (!domains.length) return null
	return (
		<span {...stylex.props(node.badges, css)}>
			{domains.map(domain => (
				<span
					key={domain.id}
					title={`${domain.number}. ${domain.title} (${RISK_LABELS[domain.risk]} risk${domain.toRead ? `, ${domain.toRead} to read line by line` : ''})`}
					{...stylex.props(
						tag.base,
						riskTag[domain.risk],
						node.badge,
						domain.toRead > 0 && node.toRead,
					)}
				>
					{domain.number}
				</span>
			))}
		</span>
	)
}

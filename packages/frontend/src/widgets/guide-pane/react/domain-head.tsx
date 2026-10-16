import { RISK_LABELS } from '@shared/ui/risk-tag-html'
import { riskTag } from '@shared/ui/risk-tag.styles'
import * as stylex from '@stylexjs/stylex'
import { tag } from '@syneva/design-system/controls.styles'

import { chromeCtx } from '../../chrome/context'

import { pane } from './guide-pane.styles'
import { HeadNav } from './head-nav'

import type { GuideDomain } from '@entities/review/guide/model'
import type { ReactElement } from 'react'

const CONSEQUENCE_TONE = {
	critical: pane.consequenceCritical,
	high: pane.consequenceHigh,
	medium: pane.consequenceMedium,
	low: null,
} as const

// The judgment first: where the domain stands in the risk order, its title and summary, the concrete consequence its risk rests on, and what to verify. Criticality and verdicts never share a tag.
export function DomainHead({
	domain,
	position,
	total,
	isStale,
}: {
	domain: GuideDomain
	position: number
	total: number
	isStale: boolean
}): ReactElement {
	const { S } = chromeCtx()
	return (
		<header {...stylex.props(pane.head)}>
			<div {...stylex.props(pane.row)}>
				<span {...stylex.props(pane.position)}>
					Domain {position} of {total}
				</span>
				<span
					{...stylex.props(tag.base, riskTag[domain.risk])}
					data-risk={domain.risk}
				>
					{RISK_LABELS[domain.risk]} risk
				</span>
				{isStale && (
					<span {...stylex.props(tag.base, tag.amber)}>Stale</span>
				)}
				<HeadNav canGoBack={S.guideReturn.length > 0} />
			</div>
			<h2 {...stylex.props(pane.title)}>{domain.title}</h2>
			<p {...stylex.props(pane.summary)}>{domain.summary}</p>
			<div
				{...stylex.props(
					pane.consequence,
					CONSEQUENCE_TONE[domain.risk],
				)}
			>
				<span {...stylex.props(pane.label)}>If this is wrong</span>
				{domain.consequence}
			</div>
			{domain.verify && (
				<div {...stylex.props(pane.consequence, pane.verify)}>
					<span {...stylex.props(pane.label)}>Verify</span>
					{domain.verify}
				</div>
			)}
		</header>
	)
}

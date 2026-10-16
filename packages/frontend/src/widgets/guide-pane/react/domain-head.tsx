import { RISK_LABELS } from '@shared/ui/risk-tag-html'
import { riskTag } from '@shared/ui/risk-tag.styles'
import * as stylex from '@stylexjs/stylex'
import { tag } from '@syneva/design-system/controls.styles'

import { chromeCtx } from '../../chrome/context'

import { pane } from './guide-pane.styles'
import { HeadNav } from './head-nav'

import type { GuideDomain } from '@entities/review/guide/model'
import type { ReactElement } from 'react'

const DRAFT_NOTE =
	"Drafted by Syneva from the code's structure: grouped and named, not explained by the agent yet"

const CONSEQUENCE_TONE = {
	critical: pane.consequenceCritical,
	high: pane.consequenceHigh,
	medium: pane.consequenceMedium,
	low: null,
} as const

// Where the explanation stands against the code: written for an earlier version of it, or not written yet.
function StatusTags({
	isStale,
	isDrafted,
}: {
	isStale: boolean
	isDrafted: boolean
}): ReactElement {
	return (
		<>
			{isStale && (
				<span {...stylex.props(tag.base, tag.amber)}>Stale</span>
			)}
			{isDrafted && (
				<span
					{...stylex.props(tag.base, tag.neutral)}
					title={DRAFT_NOTE}
				>
					Draft
				</span>
			)}
		</>
	)
}

// The judgment first: where the domain stands in the risk order, its title and summary, the concrete consequence its risk rests on, and what to verify. Criticality and verdicts never share a tag.
export function DomainHead({
	domain,
	position,
	total,
	isStale,
	isDrafted,
}: {
	domain: GuideDomain
	position: number
	total: number
	isStale: boolean
	isDrafted: boolean
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
				<StatusTags isStale={isStale} isDrafted={isDrafted} />
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

import { deskControl } from '@shared/ui/desk-control.styles'
import { Icon } from '@shared/ui/icon'
import { Kbd } from '@shared/ui/kbd'
import { RISK_LABELS } from '@shared/ui/risk-tag-html'
import { riskTag } from '@shared/ui/risk-tag.styles'
import { tip } from '@shared/ui/tip.styles'
import * as stylex from '@stylexjs/stylex'
import { control, tag } from '@syneva/design-system/controls.styles'
import { press } from '@syneva/design-system/press.styles'

import { chromeCtx } from '../../chrome/context'

import { pane } from './guide-pane.styles'

import type { GuideDomain } from '@entities/review/guide/model'
import type { ReactElement } from 'react'

const square = [
	press.control,
	control.base,
	control.quiet,
	deskControl.mini,
	tip.host,
]

const CONSEQUENCE_TONE = {
	critical: pane.consequenceCritical,
	high: pane.consequenceHigh,
	medium: pane.consequenceMedium,
	low: null,
} as const

function HeadNav({ canGoBack }: { canGoBack: boolean }): ReactElement {
	const { S } = chromeCtx()
	return (
		<span {...stylex.props(pane.navs)}>
			<button
				{...stylex.props(square)}
				disabled={!canGoBack}
				data-tip="Back to where you were (b)"
				aria-label="Back"
				onClick={() => S.guideBack?.()}
			>
				<Icon id="gly-arrow-left" /> Back <Kbd keys="b" />
			</button>
			<button
				{...stylex.props(square)}
				data-tip="Previous domain (⇧D)"
				aria-label="Previous domain"
				onClick={() => S.stepDomain?.(-1)}
			>
				<Kbd keys="⇧D" />
			</button>
			<button
				{...stylex.props(square)}
				data-tip="Next domain (d)"
				aria-label="Next domain"
				onClick={() => S.stepDomain?.(1)}
			>
				<Kbd keys="d" />
			</button>
			<button
				{...stylex.props(square, tip.end)}
				data-tip="Hide explanation (g)"
				aria-label="Hide explanation"
				onClick={() => S.toggleGuidePane?.()}
			>
				<Icon id="gly-close" />
			</button>
		</span>
	)
}

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

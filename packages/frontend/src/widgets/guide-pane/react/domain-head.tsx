import {
	isDomainDrafted,
	isDomainStale,
} from '@entities/review/guide/resolution'
import { deskControl } from '@shared/ui/desk-control.styles'
import { Kbd } from '@shared/ui/kbd'
import { RISK_LABELS } from '@shared/ui/risk-tag-html'
import { riskTag } from '@shared/ui/risk-tag.styles'
import * as stylex from '@stylexjs/stylex'
import { control, tag } from '@syneva/design-system/controls.styles'
import { kbd } from '@syneva/design-system/inline.styles'
import { press } from '@syneva/design-system/press.styles'

import { chromeCtx } from '../../chrome/context'

import { pane } from './guide-pane.styles'
import { HeadNav } from './head-nav'

import type { GuideDomain } from '@entities/review/guide/model'
import type { ReactElement } from 'react'
import type { GuideLayout } from './guide-pane'

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

// On the domain's reading, the one way into its code: Enter, or this.
function OpenCodeButton(): ReactElement {
	const { S } = chromeCtx()
	return (
		<button
			{...stylex.props(
				press.control,
				control.base,
				deskControl.compact,
				control.primary,
			)}
			onClick={() => S.openCode?.()}
		>
			Read the code
			<Kbd keys="↵" css={kbd.onFill} />
		</button>
	)
}

// Where the domain stands: its place in the risk order, its risk, the state of its explanation, and the pane's moves.
function HeadRow({
	domain,
	position,
	total,
}: {
	domain: GuideDomain
	position: number
	total: number
}): ReactElement {
	const { S } = chromeCtx()
	return (
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
			<StatusTags
				isStale={isDomainStale(S.state, domain.id)}
				isDrafted={isDomainDrafted(S.state, domain.id)}
			/>
			<HeadNav canGoBack={S.guideReturn.length > 0} />
		</div>
	)
}

// The judgment first: where the domain stands in the risk order, its title and summary, the concrete consequence its risk rests on, and what to verify. Criticality and verdicts never share a tag.
export function DomainHead({
	domain,
	position,
	total,
	layout,
}: {
	domain: GuideDomain
	position: number
	total: number
	layout: GuideLayout
}): ReactElement {
	const isPage = layout === 'page'
	return (
		<header {...stylex.props(pane.head, isPage && pane.headPage)}>
			<HeadRow domain={domain} position={position} total={total} />
			<h2 {...stylex.props(pane.title, isPage && pane.titlePage)}>
				{domain.title}
			</h2>
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
			{isPage && (
				<div {...stylex.props(pane.pageActions)}>
					<OpenCodeButton />
				</div>
			)}
		</header>
	)
}

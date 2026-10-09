import { domainById } from '@entities/review/guide/resolution'
import { Icon } from '@shared/ui/icon'
import { RISK_LABELS } from '@shared/ui/risk-tag-html'
import { riskTag } from '@shared/ui/risk-tag.styles'
import * as stylex from '@stylexjs/stylex'
import { caption, tag } from '@syneva/design-system/controls.styles'

import { chromeCtx } from '../../chrome/context'
import { lineKeys } from '../layout/keys'

import { pane } from './guide-pane.styles'
import { RefChip } from './ref-chip'

import type { GuideDomain } from '@entities/review/guide/model'
import type { ReviewState } from '@entities/review/model'
import type { ReactElement, ReactNode } from 'react'

export function Section({
	label,
	count,
	trail,
	children,
}: {
	label: string
	count?: number | undefined
	trail?: ReactNode
	children: ReactNode
}): ReactElement {
	return (
		<section {...stylex.props(pane.section)}>
			<div
				{...stylex.props(
					caption.base,
					caption.upper,
					pane.sectionLabel,
				)}
			>
				{label}
				{typeof count === 'number' && (
					<span {...stylex.props(pane.count)}>{count}</span>
				)}
				{trail && <span {...stylex.props(pane.trail)}>{trail}</span>}
			</div>
			{children}
		</section>
	)
}

function DomainLink({ domain }: { domain: GuideDomain }): ReactElement {
	const { S } = chromeCtx()
	return (
		<button
			{...stylex.props(pane.link)}
			onClick={() => S.selectDomain?.(domain.id)}
		>
			{domain.title}
		</button>
	)
}

function linkedDomains(
	state: ReviewState,
	ids: readonly string[],
): GuideDomain[] {
	return ids
		.map(id => domainById(state, id))
		.filter((candidate): candidate is GuideDomain => !!candidate)
}

// Prerequisites are summarized beside the domain, never used to move it down: the reviewer reads them first by choice.
export function Prerequisites({
	domain,
	state,
}: {
	domain: GuideDomain
	state: ReviewState
}): ReactElement | null {
	const prerequisites = linkedDomains(state, domain.prerequisites ?? [])
	if (!prerequisites.length) return null
	return (
		<Section label="Read first">
			{prerequisites.map(prerequisite => (
				<div key={prerequisite.id} {...stylex.props(pane.card)}>
					<DomainLink domain={prerequisite} />{' '}
					<span
						{...stylex.props(tag.base, riskTag[prerequisite.risk])}
					>
						{RISK_LABELS[prerequisite.risk]} risk
					</span>
					<br />
					{prerequisite.summary}
				</div>
			))}
		</Section>
	)
}

// The facts the risk rests on, labelled as the agent's claims; each cites the references it can.
export function Evidence({
	domain,
}: {
	domain: GuideDomain
}): ReactElement | null {
	const evidence = domain.evidence ?? []
	if (!evidence.length) return null
	const references = domain.references ?? []
	const keys = lineKeys(evidence)
	return (
		<Section
			label="Evidence"
			trail={
				<span {...stylex.props(tag.base, tag.accent)}>
					agent's claims
				</span>
			}
		>
			<ul {...stylex.props(pane.list)}>
				{evidence.map((claim, index) => (
					<li key={keys[index]} {...stylex.props(pane.claim)}>
						<span
							{...stylex.props(pane.claimMark)}
							aria-hidden="true"
						/>
						<span>
							{claim.text}{' '}
							{references
								.filter(reference =>
									(claim.refs ?? []).includes(reference.id),
								)
								.map(reference => (
									<RefChip
										key={reference.id}
										domain={domain}
										reference={reference}
									/>
								))}
						</span>
					</li>
				))}
			</ul>
		</Section>
	)
}

export function Unknowns({
	domain,
}: {
	domain: GuideDomain
}): ReactElement | null {
	const unknowns = domain.unknowns ?? []
	if (!unknowns.length) return null
	const keys = lineKeys(unknowns.map(text => ({ text })))
	return (
		<Section label="Unknowns">
			<ul {...stylex.props(pane.list)}>
				{unknowns.map((unknown, index) => (
					<li key={keys[index]} {...stylex.props(pane.claim)}>
						<span
							{...stylex.props(pane.claimMark, pane.unknownMark)}
							aria-hidden="true"
						/>
						<span>{unknown}</span>
					</li>
				))}
			</ul>
		</Section>
	)
}

export function Related({
	domain,
	state,
}: {
	domain: GuideDomain
	state: ReviewState
}): ReactElement | null {
	const links = (domain.related ?? []).flatMap(link => {
		const target = domainById(state, link.domainId)
		return target ? [{ note: link.note, target }] : []
	})
	if (!links.length) return null
	return (
		<Section label="Related">
			{links.map(link => (
				<div key={link.target.id} {...stylex.props(pane.card)}>
					<DomainLink domain={link.target} />
					{link.note ? ` - ${link.note}` : ''}
				</div>
			))}
		</Section>
	)
}

export function StaleBanner({ reasons }: { reasons: string[] }): ReactElement {
	return (
		<div {...stylex.props(pane.stale)} role="status">
			<Icon id="gly-warn" />
			<span>
				<b>Explanation out of date.</b> {reasons.join('; ')}. The prose
				and the diagrams describe the earlier version; ask your agent
				for a fresh guide.
			</span>
		</div>
	)
}

import { domainThreads } from '@entities/review/domain-threads'
import { orderedDomains } from '@entities/review/guide/domains'
import {
	domainById,
	domainProgress,
	isDomainStale,
	staleReasons,
} from '@entities/review/guide/resolution'
import { useStoreFields } from '@shared/lib/use-store-version'
import * as stylex from '@stylexjs/stylex'
import { tag } from '@syneva/design-system/controls.styles'

import { chromeCtx } from '../../chrome/context'

import { ExplanationBlockView } from './blocks/explanation-block'
import { CoverageList } from './coverage-list'
import { BlockFeedback, Discussion, DomainComposer } from './discussion'
import { DomainHead } from './domain-head'
import { GoneDomainPane } from './gone-domain'
import { pane } from './guide-pane.styles'
import {
	CriticalSpans,
	Evidence,
	Prerequisites,
	Related,
	Section,
	StaleBanner,
	Unknowns,
} from './pane-sections'

import type { DomainThread } from '@entities/review/domain-threads'
import type { GuideDomain } from '@entities/review/guide/model'
import type { ReviewState } from '@entities/review/model'
import type { ReactElement } from 'react'

// Where the explanation is drawn: the column beside the code, or the page the domain reads as, full width, before its code opens.
export type GuideLayout = 'column' | 'page'

function DomainBody({
	domain,
	state,
	layout,
}: {
	domain: GuideDomain
	state: ReviewState
	layout: GuideLayout
}): ReactElement {
	const progress = domainProgress(domain, state.changes)
	return (
		<div
			{...stylex.props(pane.body, layout === 'page' && pane.bodyPage)}
			data-guide-pane-body=""
		>
			<Prerequisites domain={domain} state={state} />
			<CriticalSpans domain={domain} state={state} />
			<Section
				label="Changed code"
				count={progress.total}
				trail={
					<span {...stylex.props(tag.base, tag.neutral)}>
						{progress.decided}/{progress.total} decided
					</span>
				}
			>
				<CoverageList domain={domain} state={state} />
			</Section>
			{domain.blocks.map(block => (
				<BlockWithFeedback
					key={block.id}
					domain={domain}
					block={block}
				/>
			))}
			<Evidence domain={domain} />
			<Unknowns domain={domain} />
			<Related domain={domain} state={state} />
			<Discussion domain={domain} state={state} />
		</div>
	)
}

// A block with its feedback hook; the composer opens right under the block it is about.
function BlockWithFeedback({
	domain,
	block,
}: {
	domain: GuideDomain
	block: GuideDomain['blocks'][number]
}): ReactElement {
	const { S } = chromeCtx()
	const composer = S.domainComposer
	const isOnBlock =
		composer?.domainId === domain.id && composer.blockId === block.id
	return (
		<>
			<ExplanationBlockView
				domain={domain}
				block={block}
				actions={<BlockFeedback domain={domain} block={block} />}
			/>
			{isOnBlock && (
				<DomainComposer
					target={{ blockId: block.id, blockTitle: block.title }}
				/>
			)}
		</>
	)
}

function selectedDomain(
	state: ReviewState | null,
	domainId: string | null,
): GuideDomain | undefined {
	const chosen = domainId ? domainById(state, domainId) : undefined
	return chosen ?? orderedDomains(state?.guide)[0]
}

// A selected domain the attached guide no longer has (reached from the notes panel) keeps its threads on screen rather than falling back to another domain's discussion; a miss without threads falls back.
function goneThreads(
	state: ReviewState | null,
	domainId: string | null,
): DomainThread[] {
	if (!domainId || domainById(state, domainId)) return []
	return domainThreads(state, domainId)
}

function EmptyPane(): ReactElement {
	return (
		<aside {...stylex.props(pane.aside)} aria-label="Explanation">
			<p {...stylex.props(pane.empty)}>
				This guide has no domain to explain.
			</p>
		</aside>
	)
}

function DomainPane({ layout }: { layout: GuideLayout }): ReactElement {
	const { S } = chromeCtx()
	const { state } = S
	const gone = goneThreads(state, S.domainId)
	const [firstGone] = gone
	if (firstGone)
		return <GoneDomainPane target={firstGone.target} threads={gone} />
	const domain = selectedDomain(state, S.domainId)
	if (!state || !domain) return <EmptyPane />
	const domains = orderedDomains(state.guide)
	const isStale = isDomainStale(state, domain.id)
	const isPage = layout === 'page'
	return (
		<aside
			{...stylex.props(isPage ? pane.sheet : pane.aside)}
			aria-label="Explanation"
			data-guide-pane=""
			data-guide-controls=""
		>
			<DomainHead
				domain={domain}
				position={domains.indexOf(domain) + 1}
				total={domains.length}
				layout={layout}
			/>
			{isStale && (
				<StaleBanner
					reasons={staleReasons(state, domain.id)}
					css={isPage ? pane.stalePage : undefined}
				/>
			)}
			<DomainBody domain={domain} state={state} layout={layout} />
		</aside>
	)
}

// The explanation of the selected domain: the column beside the real diff, or the page it reads as before its code opens. Nothing here approves anything; the verdict controls stay on the code.
export function GuidePane({
	layout = 'column',
}: {
	layout?: GuideLayout
}): ReactElement {
	useStoreFields(
		'state',
		'domainId',
		'guideExpanded',
		'guideReturn',
		'fileIndex',
		'preview',
		'markdownTick',
		'domainComposer',
		'domainComposerBody',
	)
	if (layout === 'page')
		return (
			<div {...stylex.props(pane.page)} data-reading="">
				<DomainPane layout={layout} />
			</div>
		)
	return <DomainPane layout={layout} />
}

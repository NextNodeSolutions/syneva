import { useCallback } from 'react'

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
import type { ReactElement, ReactNode, UIEvent } from 'react'

// Where the explanation is drawn: the column beside the code, or the page the domain reads as, full width, before its code opens.
export type GuideLayout = 'column' | 'page'

type ScrollMemory = readonly [
	attach: (element: HTMLElement | null) => void,
	onScroll: (event: UIEvent<HTMLElement>) => void,
]

const lastScroll: Partial<
	Record<GuideLayout, { domainId: string; top: number }>
> = {}

// The scroller remembers where the domain it shows was left, per layout: the explanation hidden and shown again, or the page left for the project level and reopened, comes back to the same place; another domain starts at the top.
function useScrollMemory(layout: GuideLayout, domainId: string): ScrollMemory {
	const attach = useCallback(
		(element: HTMLElement | null) => {
			if (!element) return
			const last = lastScroll[layout]
			element.scrollTo({
				top: last?.domainId === domainId ? last.top : 0,
			})
		},
		[layout, domainId],
	)
	const onScroll = (event: UIEvent<HTMLElement>): void => {
		lastScroll[layout] = { domainId, top: event.currentTarget.scrollTop }
	}
	return [attach, onScroll]
}

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
	// The column scrolls by itself and keeps its place; the page's scroller is its wrapper.
	const isColumn = layout === 'column'
	const [attach, onScroll] = useScrollMemory(layout, domain.id)
	return (
		<div
			{...stylex.props(pane.body, layout === 'page' && pane.bodyPage)}
			data-guide-pane-body=""
			ref={isColumn ? attach : undefined}
			onScroll={isColumn ? onScroll : undefined}
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

function DomainAside({
	domain,
	state,
	layout,
}: {
	domain: GuideDomain
	state: ReviewState
	layout: GuideLayout
}): ReactElement {
	const domains = orderedDomains(state.guide)
	const isStale = isDomainStale(state, domain.id)
	const isPage = layout === 'page'
	// The column is the morphing element; on the page, its wrapper is.
	const isColumn = !isPage
	return (
		<aside
			{...stylex.props(isPage ? pane.sheet : pane.aside)}
			aria-label="Explanation"
			data-guide-pane=""
			data-guide-controls=""
			data-morph={isColumn ? 'reading' : undefined}
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

// The page the domain reads as: the full-width scroller around the sheet, the morphing element, with the place it was left.
function PageFrame({
	domainId,
	children,
}: {
	domainId: string
	children: ReactNode
}): ReactElement {
	const [attach, onScroll] = useScrollMemory('page', domainId)
	return (
		<div
			{...stylex.props(pane.page)}
			data-reading=""
			data-morph="reading"
			ref={attach}
			onScroll={onScroll}
		>
			{children}
		</div>
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
	const aside = <DomainAside domain={domain} state={state} layout={layout} />
	if (layout === 'column') return aside
	return <PageFrame domainId={domain.id}>{aside}</PageFrame>
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
	return <DomainPane layout={layout} />
}

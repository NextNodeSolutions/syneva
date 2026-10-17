import { lazy, Suspense, useCallback, useState } from 'react'

import { orderedDomains } from '@entities/review/guide/domains'
import {
	domainProgress,
	isDomainDrafted,
	isDomainStale,
	isOverviewDrafted,
	unassignedChanges,
	unassignedFiles,
} from '@entities/review/guide/resolution'
import { deskControl } from '@shared/ui/desk-control.styles'
import { Icon } from '@shared/ui/icon'
import { Kbd } from '@shared/ui/kbd'
import { RISK_LABELS } from '@shared/ui/risk-tag-html'
import { riskTag } from '@shared/ui/risk-tag.styles'
import * as stylex from '@stylexjs/stylex'
import { caption, control, tag } from '@syneva/design-system/controls.styles'
import { kbd } from '@syneva/design-system/inline.styles'
import { press } from '@syneva/design-system/press.styles'
import { chromeCtx } from '@widgets/chrome/context'
import { MarkdownHtml } from '@widgets/guide-pane/react/blocks/markdown-html'
import { canvasDomains } from '@widgets/system-canvas/canvas-domains'

import { project } from './project-level.styles'

import type { GuideDomain } from '@entities/review/guide/model'
import type { ReviewState } from '@entities/review/model'
import type { ReactElement } from 'react'

// The system canvas (React Flow, ELK) is a chunk of its own, loaded by the first project level whose guide draws a model.
const SystemCanvas = lazy(async () => {
	const module = await import('@widgets/system-canvas/react/system-canvas')
	return { default: module.SystemCanvas }
})

function DomainRowHead({
	domain,
	index,
	state,
}: {
	domain: GuideDomain
	index: number
	state: ReviewState
}): ReactElement {
	const files = new Set(domain.members.map(member => member.path)).size
	const progress = domainProgress(domain, state.changes)
	return (
		<span {...stylex.props(project.domainHead)}>
			<span {...stylex.props(project.number)}>{index + 1}</span>
			<span {...stylex.props(tag.base, riskTag[domain.risk])}>
				{RISK_LABELS[domain.risk]} risk
			</span>
			{isDomainStale(state, domain.id) && (
				<span {...stylex.props(tag.base, tag.amber)}>Stale</span>
			)}
			{isDomainDrafted(state, domain.id) && (
				<span {...stylex.props(tag.base, tag.neutral)}>Draft</span>
			)}
			<span {...stylex.props(project.domainTitle)}>{domain.title}</span>
			<span {...stylex.props(caption.base, project.domainFiles)}>
				{files} {files === 1 ? 'file' : 'files'} · {progress.decided}/
				{progress.total} decided
			</span>
		</span>
	)
}

function DomainRow({
	domain,
	index,
	state,
	onFocus,
}: {
	domain: GuideDomain
	index: number
	state: ReviewState
	onFocus: (id: string | null) => void
}): ReactElement {
	const { S } = chromeCtx()
	return (
		<li {...stylex.props(project.domain)}>
			<button
				{...stylex.props(project.domainButton)}
				data-domain={domain.id}
				onClick={() => S.selectDomain?.(domain.id)}
				onMouseEnter={() => onFocus(domain.id)}
				onMouseLeave={() => onFocus(null)}
				onFocus={() => onFocus(domain.id)}
				onBlur={() => onFocus(null)}
			>
				<DomainRowHead domain={domain} index={index} state={state} />
				<p {...stylex.props(project.consequence)}>
					{domain.consequence}
				</p>
			</button>
		</li>
	)
}

// Changes the guide does not own (after a reload exposed them): pending, never folded into a domain, and named where the reviewer finds them - a block by its file, a whole-file operation in the Guide tab's list of what the guide leaves out.
function UnassignedNote({
	state,
}: {
	state: ReviewState
}): ReactElement | null {
	const changes = unassignedChanges(state)
	const files = unassignedFiles(state).length
	if (!changes.length && !files) return null
	const paths = [...new Set(changes.map(change => change.path))]
	const parts = [
		changes.length
			? `${changes.length} changed ${changes.length === 1 ? 'block' : 'blocks'} (in ${paths.join(', ')})`
			: '',
		files
			? `${files} file ${files === 1 ? 'operation' : 'operations'} (listed in the Guide tab)`
			: '',
	].filter(Boolean)
	return (
		<div {...stylex.props(project.unassigned)}>
			<Icon id="gly-warn" /> {parts.join(' and ')} not in the guide: still
			pending.
		</div>
	)
}

// While the agent explains the changeset, the guide reads as Syneva drew it: said once, above the domains it concerns.
function DraftNote({ state }: { state: ReviewState }): ReactElement | null {
	const domains = state.guideResolution?.drafted?.length ?? 0
	if (!domains && !isOverviewDrafted(state)) return null
	return (
		<div {...stylex.props(project.drafted)}>
			Syneva drafted this guide from the code's structure: the domains
			marked Draft are grouped and named, not explained yet. Your agent's
			explanations replace them as it posts them.
		</div>
	)
}

function StaleNote(): ReactElement {
	return (
		<div {...stylex.props(project.stale)}>
			<Icon id="gly-warn" />
			<span>
				Parts of this guide describe an earlier version of the diff -
				the stale domains are marked below. Ask your agent for a fresh
				guide (
				<code {...stylex.props(project.staleCode)}>
					syneva reload --guide
				</code>
				).
			</span>
		</div>
	)
}

// The changeset's name and intent, with what stands between the guide and the code: a stale or drafted guide, the changes it does not own.
function ProjectHead({ state }: { state: ReviewState }): ReactElement {
	const { S } = chromeCtx()
	const title = state.target?.trim() ? state.target : 'Review'
	const domains = orderedDomains(state.guide).length
	return (
		<>
			<h1 {...stylex.props(project.title)}>{title}</h1>
			<div {...stylex.props(caption.base, project.sub)}>
				{state.mode} · {state.session} · {state.files.length} files ·{' '}
				{domains} {domains === 1 ? 'domain' : 'domains'}
			</div>
			{(S.guideStale?.() ?? false) && <StaleNote />}
			<DraftNote state={state} />
			<UnassignedNote state={state} />
			<div {...stylex.props(project.intent)}>
				<MarkdownHtml markdown={state.guide?.overview ?? ''} />
			</div>
		</>
	)
}

function StartButton(): ReactElement {
	const { S } = chromeCtx()
	return (
		<div {...stylex.props(project.actions)}>
			<button
				{...stylex.props(
					press.control,
					control.base,
					deskControl.compact,
					control.primary,
				)}
				onClick={() => S.startGuided?.()}
			>
				Start review
				<Kbd keys="↵" css={kbd.onFill} />
			</button>
		</div>
	)
}

// The domains highest risk first, each with the consequence its risk rests on; the row the pointer or the focus rests on names the domain to light up on the drawing.
function DomainList({
	state,
	onFocus,
}: {
	state: ReviewState
	onFocus: (id: string | null) => void
}): ReactElement {
	return (
		<>
			<div {...stylex.props(caption.base, caption.upper, project.label)}>
				Domains, highest risk first
			</div>
			<ol {...stylex.props(project.domains)}>
				{orderedDomains(state.guide).map((domain, index) => (
					<DomainRow
						key={domain.id}
						domain={domain}
						index={index}
						state={state}
						onFocus={onFocus}
					/>
				))}
			</ol>
		</>
	)
}

// The project level: the changeset's intent, the system it touches, then its domains and Start, which opens the first domain.
export function ProjectLevel({ state }: { state: ReviewState }): ReactElement {
	const { S } = chromeCtx()
	const [focusDomain, setFocusDomain] = useState<string | null>(null)
	const openDomain = useCallback((id: string) => S.selectDomain?.(id), [S])
	const model = state.guide?.model
	return (
		<div {...stylex.props(project.page)}>
			<div
				{...stylex.props(
					project.card,
					Boolean(model) && project.cardWide,
				)}
			>
				<ProjectHead state={state} />
				{model && (
					<div {...stylex.props(project.canvasSlot)}>
						<Suspense fallback={null}>
							<SystemCanvas
								model={model}
								domains={canvasDomains(state)}
								focusDomain={focusDomain}
								onOpenDomain={openDomain}
							/>
						</Suspense>
					</div>
				)}
				<DomainList state={state} onFocus={setFocusDomain} />
				<StartButton />
			</div>
		</div>
	)
}

import { orderedDomains } from '@entities/review/guide/domains'
import { changeSpan } from '@entities/review/guide/navigation'
import {
	domainProgress,
	isDomainStale,
	unassignedChanges,
	unassignedFiles,
} from '@entities/review/guide/resolution'
import { RISK_LABELS } from '@shared/ui/risk-tag-html'
import { riskTag } from '@shared/ui/risk-tag.styles'
import * as stylex from '@stylexjs/stylex'
import { caption, tag } from '@syneva/design-system/controls.styles'

import { chromeCtx } from '../context'

import { navigator as styles } from './domain-navigator.styles'

import type { GuideDomain } from '@entities/review/guide/model'
import type { ChangeState, ReviewState } from '@entities/review/model'
import type { ReactElement } from 'react'

const PERCENT = 100
const MINUS = '\u2212'

function Verdict({
	progress,
}: {
	progress: ReturnType<typeof domainProgress>
}): ReactElement | null {
	if (!progress.total) return null
	if (progress.decided < progress.total)
		return (
			<span {...stylex.props(tag.base, tag.neutral)}>
				{progress.decided}/{progress.total} decided
			</span>
		)
	if (progress.rejected)
		return (
			<span {...stylex.props(tag.base, tag.amber)}>
				Changes requested
			</span>
		)
	return <span {...stylex.props(tag.base, tag.green)}>Decided</span>
}

function share(part: number, total: number): string {
	return `${Math.round((part / total) * PERCENT)}%`
}

// Decided in green, undone in amber, never side by side in one bar: the undone share overlays the decided one from the left.
function Meter({
	progress,
}: {
	progress: ReturnType<typeof domainProgress>
}): ReactElement | null {
	if (!progress.total) return null
	return (
		<span {...stylex.props(styles.meter)}>
			<i
				{...stylex.props(styles.meterDone)}
				style={{ width: share(progress.decided, progress.total) }}
			/>
			{progress.rejected > 0 && (
				<i
					{...stylex.props(styles.meterRejected)}
					style={{ width: share(progress.rejected, progress.total) }}
				/>
			)}
		</span>
	)
}

function scopeLabel(total: number, files: number): string {
	const fileWord = files === 1 ? 'file' : 'files'
	if (!total) return `${files} ${fileWord}, no changed block`
	return `${total} ${total === 1 ? 'change' : 'changes'} · ${files} ${fileWord}`
}

// One domain in the risk order: its criticality in words, its title and consequence, and its progress from the owned changes' verdicts (green decided, amber undone) - never from reading.
function DomainRow({
	domain,
	index,
	state,
}: {
	domain: GuideDomain
	index: number
	state: ReviewState
}): ReactElement {
	const { S } = chromeCtx()
	const progress = domainProgress(domain, state.changes)
	const isCurrent = S.domainId === domain.id && !S.overviewOpen
	const files = new Set(domain.members.map(member => member.path)).size
	return (
		<button
			{...stylex.props(styles.row, isCurrent && styles.current)}
			aria-current={isCurrent || undefined}
			data-domain={domain.id}
			title={domain.title}
			onClick={() => S.selectDomain?.(domain.id)}
		>
			<span {...stylex.props(styles.top)}>
				<span {...stylex.props(styles.index)}>{index + 1}</span>
				<span {...stylex.props(tag.base, riskTag[domain.risk])}>
					{RISK_LABELS[domain.risk]} risk
				</span>
				{isDomainStale(state, domain.id) && (
					<span {...stylex.props(tag.base, tag.amber)}>Stale</span>
				)}
				<span {...stylex.props(styles.title)}>{domain.title}</span>
			</span>
			<p {...stylex.props(styles.consequence)}>{domain.consequence}</p>
			<Meter progress={progress} />
			<span {...stylex.props(styles.foot)}>
				<span>{scopeLabel(progress.total, files)}</span>
				<Verdict progress={progress} />
			</span>
		</button>
	)
}

// What no domain owns after a reload: pending, listed by file, each row landing on its code; never folded into a domain.
function Unassigned({ state }: { state: ReviewState }): ReactElement | null {
	const { S } = chromeCtx()
	const changes = unassignedChanges(state)
	const files = unassignedFiles(state)
	if (!changes.length && !files.length) return null
	const count = changes.length + files.length
	return (
		<div {...stylex.props(styles.unassigned)} role="note">
			<span {...stylex.props(styles.unassignedTitle)}>
				{count} {count === 1 ? 'change' : 'changes'} not in the guide
			</span>
			{changes.map((change: ChangeState) => (
				<button
					key={change.id}
					{...stylex.props(styles.unassignedRow)}
					onClick={() => S.jumpToSpan?.(changeSpan(change))}
				>
					<span>{change.path}</span>
					<span>
						{change.side === 'deletions' ? MINUS : '+'}
						{change.lineNumber}
					</span>
				</button>
			))}
			{files.map(path => (
				<button
					key={path}
					{...stylex.props(styles.unassignedRow)}
					onClick={() => {
						const index = state.files.findIndex(
							file => file.path === path,
						)
						if (index >= 0) S.selectFile?.(index)
					}}
				>
					<span>{path}</span>
					<span>whole file</span>
				</button>
			))}
		</div>
	)
}

// The Guide tab: the changeset in one look, then its domains highest risk first. The complete file list stays one tab away (Tree).
// The overview is Markdown written for the pane; the navigator shows its words without the markers.
function plainWords(markdown: string): string {
	return markdown
		.replace(/[*_`#>]+/g, '')
		.replace(/\s+/g, ' ')
		.trim()
}

export function DomainNavigator(): ReactElement {
	const { S } = chromeCtx()
	const { state } = S
	if (!state?.guide) return <></>
	const domains = orderedDomains(state.guide)
	const owned = new Set(
		domains.flatMap(domain => domain.members.map(member => member.path)),
	)
	return (
		<>
			<div {...stylex.props(styles.overview)}>
				<span {...stylex.props(caption.base, caption.upper)}>
					Changeset
				</span>
				<p {...stylex.props(styles.intent)}>
					{plainWords(state.guide.overview)}
				</p>
				<span {...stylex.props(styles.cover)}>
					<span>
						<span {...stylex.props(styles.coverCount)}>
							{domains.length}
						</span>{' '}
						{domains.length === 1 ? 'domain' : 'domains'}
					</span>
					<span>
						<span {...stylex.props(styles.coverCount)}>
							{owned.size}
						</span>
						/{state.files.length} files owned
					</span>
				</span>
			</div>
			{domains.map((domain, index) => (
				<DomainRow
					key={domain.id}
					domain={domain}
					index={index}
					state={state}
				/>
			))}
			<Unassigned state={state} />
		</>
	)
}

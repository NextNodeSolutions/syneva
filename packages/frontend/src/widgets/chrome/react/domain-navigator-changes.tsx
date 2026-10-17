import {
	changeSpan,
	changesByFile,
	orderedDomainChanges,
} from '@entities/review/guide/navigation'
import {
	unassignedChanges,
	unassignedFiles,
} from '@entities/review/guide/resolution'
import * as stylex from '@stylexjs/stylex'
import { tag } from '@syneva/design-system/controls.styles'

import { chromeCtx } from '../context'

import { navigator as styles } from './domain-navigator.styles'

import type { GuideDomain } from '@entities/review/guide/model'
import type { ChangeState, ReviewState } from '@entities/review/model'
import type { ReactElement } from 'react'

const MINUS = '\u2212'

const VERDICT = {
	pending: { label: 'Pending', style: tag.neutral },
	accepted: { label: 'Kept', style: tag.green },
	rejected: { label: 'Undone', style: tag.amber },
} as const

function lineLabel(change: ChangeState): string {
	return `${change.side === 'deletions' ? MINUS : '+'}${change.lineNumber}`
}

function ChangeChip({ change }: { change: ChangeState }): ReactElement {
	const { S } = chromeCtx()
	const verdict = VERDICT[change.status]
	return (
		<button
			{...stylex.props(tag.base, verdict.style, styles.changeChip)}
			data-unit={change.id}
			title={`${lineLabel(change)} · ${verdict.label}`}
			onClick={() => S.jumpToSpan?.(changeSpan(change))}
		>
			{lineLabel(change)}
		</button>
	)
}

// The open domain's owned changes by file in reading order: the path once, each changed block a span tinted by its verdict, any of them one click away.
export function DomainChanges({
	domain,
	state,
}: {
	domain: GuideDomain
	state: ReviewState
}): ReactElement | null {
	const { S } = chromeCtx()
	const files = changesByFile(orderedDomainChanges(domain, state))
	if (!files.length) return null
	return (
		<div {...stylex.props(styles.changes)}>
			{files.map(({ path, changes }) => (
				<div key={path} {...stylex.props(styles.changeFile)}>
					<button
						{...stylex.props(styles.changeRow)}
						title={path}
						onClick={() => {
							const [first] = changes
							if (first) S.jumpToSpan?.(changeSpan(first))
						}}
					>
						<span {...stylex.props(styles.changePath)}>{path}</span>
						{changes.length > 1 && (
							<span {...stylex.props(styles.changeLine)}>
								{changes.length}
							</span>
						)}
					</button>
					<span {...stylex.props(styles.changeSpans)}>
						{changes.map(change => (
							<ChangeChip key={change.id} change={change} />
						))}
					</span>
				</div>
			))}
		</div>
	)
}

// What no domain owns after a reload: pending, listed by file, each row landing on its code; never folded into a domain.
export function Unassigned({
	state,
}: {
	state: ReviewState
}): ReactElement | null {
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
			{changesByFile(changes).map(group => (
				<div key={group.path} {...stylex.props(styles.unassignedRow)}>
					<span {...stylex.props(styles.changePath)}>
						{group.path}
					</span>
					{group.changes.map(change => (
						<button
							key={change.id}
							{...stylex.props(styles.unassignedSpan)}
							onClick={() => S.jumpToSpan?.(changeSpan(change))}
						>
							{lineLabel(change)}
						</button>
					))}
				</div>
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

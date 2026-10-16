import {
	changeSpan,
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

// The open domain's owned changes in reading order, each with its verdict: any of them is one click away, not only the first.
export function DomainChanges({
	domain,
	state,
}: {
	domain: GuideDomain
	state: ReviewState
}): ReactElement | null {
	const { S } = chromeCtx()
	const changes = orderedDomainChanges(domain, state)
	if (!changes.length) return null
	return (
		<div {...stylex.props(styles.changes)}>
			{changes.map(change => {
				const verdict = VERDICT[change.status]
				return (
					<button
						key={change.id}
						{...stylex.props(styles.changeRow)}
						data-unit={change.id}
						title={change.path}
						onClick={() => S.jumpToSpan?.(changeSpan(change))}
					>
						<span {...stylex.props(styles.changePath)}>
							{change.path}
						</span>
						<span {...stylex.props(styles.changeLine)}>
							{change.side === 'deletions' ? MINUS : '+'}
							{change.lineNumber}
						</span>
						<span {...stylex.props(tag.base, verdict.style)}>
							{verdict.label}
						</span>
					</button>
				)
			})}
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

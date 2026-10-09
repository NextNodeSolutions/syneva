import { currentFileOrNull } from '@entities/review/changes'
import {
	changeSpan,
	orderedDomainChanges,
} from '@entities/review/guide/navigation'
import * as stylex from '@stylexjs/stylex'
import { tag } from '@syneva/design-system/controls.styles'

import { chromeCtx } from '../../chrome/context'

import { coverage } from './guide-pane.styles'

import type { GuideDomain } from '@entities/review/guide/model'
import type { ChangeState, ReviewState } from '@entities/review/model'
import type { ReactElement } from 'react'

const VERDICT = {
	pending: { label: 'Pending', style: tag.neutral },
	accepted: { label: 'Kept', style: tag.green },
	rejected: { label: 'Undone', style: tag.amber },
} as const

const MINUS = '\u2212'
const EN_DASH = '\u2013'

function spanLabel(change: ChangeState): string {
	const sign = change.side === 'deletions' ? MINUS : '+'
	const end =
		change.endLine && change.endLine !== change.lineNumber
			? `${EN_DASH}${change.endLine}`
			: ''
	return `${sign}${change.lineNumber}${end}`
}

// One canonical change with the verdict its decision record holds, whatever explains it; the click lands on it in the real diff.
function ChangeRow({
	change,
	isCurrent,
}: {
	change: ChangeState
	isCurrent: boolean
}): ReactElement {
	const { S } = chromeCtx()
	const verdict = VERDICT[change.status]
	return (
		<button
			{...stylex.props(coverage.row, isCurrent && coverage.current)}
			data-unit={change.id}
			onClick={() => S.jumpToSpan?.(changeSpan(change))}
		>
			<span {...stylex.props(coverage.path)}>{change.path}</span>
			<span {...stylex.props(coverage.lines)}>{spanLabel(change)}</span>
			<span {...stylex.props(tag.base, verdict.style, coverage.verdict)}>
				{verdict.label}
			</span>
		</button>
	)
}

function FileRow({
	path,
	state,
}: {
	path: string
	state: ReviewState
}): ReactElement {
	const { S } = chromeCtx()
	return (
		<button
			{...stylex.props(coverage.row)}
			onClick={() => {
				const index = state.files.findIndex(file => file.path === path)
				if (index >= 0) S.selectFile?.(index)
			}}
		>
			<span {...stylex.props(coverage.path)}>{path}</span>
			<span {...stylex.props(coverage.lines)}>whole file</span>
		</button>
	)
}

// The changed code the domain owns: one row per canonical change, then its whole-file operations.
export function CoverageList({
	domain,
	state,
}: {
	domain: GuideDomain
	state: ReviewState
}): ReactElement {
	const { S } = chromeCtx()
	const shown = currentFileOrNull(state.files, S.preview, S.fileIndex)
	return (
		<div>
			{orderedDomainChanges(domain, state).map(change => (
				<ChangeRow
					key={change.id}
					change={change}
					isCurrent={shown?.path === change.path}
				/>
			))}
			{domain.members
				.filter(member => member.kind === 'file')
				.map(member => (
					<FileRow
						key={member.path}
						path={member.path}
						state={state}
					/>
				))}
		</div>
	)
}

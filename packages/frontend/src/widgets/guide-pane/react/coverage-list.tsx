import { currentFileOrNull } from '@entities/review/changes'
import {
	changeSpan,
	changesByFile,
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

// The folder gives way, the file name never does: a long path ellipsizes its directories, not what the reviewer scans for.
function PathLabel({ path }: { path: string }): ReactElement {
	const slash = path.lastIndexOf('/')
	const dir = slash >= 0 ? path.slice(0, slash + 1) : ''
	const name = slash >= 0 ? path.slice(slash + 1) : path
	return (
		<span {...stylex.props(coverage.path)} title={path}>
			{dir && <span {...stylex.props(coverage.dir)}>{dir}</span>}
			<span {...stylex.props(coverage.name)}>{name}</span>
		</span>
	)
}

// A file's verdict in one tag: every change kept, every change decided with some undone, or how many are still open.
function FileVerdict({
	changes,
}: {
	changes: readonly ChangeState[]
}): ReactElement {
	const decided = changes.filter(change => change.status !== 'pending')
	if (decided.length < changes.length)
		return (
			<span {...stylex.props(tag.base, tag.neutral, coverage.verdict)}>
				{decided.length}/{changes.length}
			</span>
		)
	const verdict = changes.some(change => change.status === 'rejected')
		? VERDICT.rejected
		: VERDICT.accepted
	return (
		<span {...stylex.props(tag.base, verdict.style, coverage.verdict)}>
			{verdict.label}
		</span>
	)
}

// One span of a file's changes, tinted by its verdict; the click lands on it in the real diff.
function SpanChip({ change }: { change: ChangeState }): ReactElement {
	const { S } = chromeCtx()
	const verdict = VERDICT[change.status]
	return (
		<button
			{...stylex.props(tag.base, verdict.style, coverage.chip)}
			data-unit={change.id}
			title={`${spanLabel(change)} · ${verdict.label}`}
			onClick={() => S.jumpToSpan?.(changeSpan(change))}
		>
			{spanLabel(change)}
		</button>
	)
}

function selectFile(state: ReviewState, path: string): void {
	const { S } = chromeCtx()
	const index = state.files.findIndex(file => file.path === path)
	if (index >= 0) S.selectFile?.(index)
}

// What the file row says beside the path: the one span, how many spans follow, or the whole-file operation alone.
function scopeLabel(
	changes: readonly ChangeState[],
	single: ChangeState | undefined,
): string {
	if (single) return spanLabel(single)
	if (!changes.length) return 'whole file'
	return `${changes.length} changes`
}

// One file the domain touches, however many blocks it owns there: the path once, then its spans. A single change keeps the one-line row; the head of a longer list lands on the file's first change.
function FileGroup({
	path,
	changes,
	isWholeFile,
	isCurrent,
	state,
}: {
	path: string
	changes: readonly ChangeState[]
	isWholeFile: boolean
	isCurrent: boolean
	state: ReviewState
}): ReactElement {
	const { S } = chromeCtx()
	const [first] = changes
	const single = changes.length === 1 && !isWholeFile ? first : undefined
	return (
		<div {...stylex.props(coverage.file, isCurrent && coverage.current)}>
			<button
				{...stylex.props(coverage.row)}
				data-unit={single?.id}
				onClick={() =>
					first
						? S.jumpToSpan?.(changeSpan(first))
						: selectFile(state, path)
				}
			>
				<PathLabel path={path} />
				<span {...stylex.props(coverage.lines)}>
					{scopeLabel(changes, single)}
				</span>
				{changes.length > 0 && <FileVerdict changes={changes} />}
			</button>
			{!single && changes.length > 0 && (
				<div {...stylex.props(coverage.spans)}>
					{changes.map(change => (
						<SpanChip key={change.id} change={change} />
					))}
					{isWholeFile && (
						<span {...stylex.props(coverage.lines)}>
							whole file
						</span>
					)}
				</div>
			)}
		</div>
	)
}

// The changed code the domain owns, one entry per file in reading order: its changed blocks as spans, then the whole-file operations no block carries.
export function CoverageList({
	domain,
	state,
}: {
	domain: GuideDomain
	state: ReviewState
}): ReactElement {
	const { S } = chromeCtx()
	const shown = currentFileOrNull(state.files, S.preview, S.fileIndex)
	const groups = changesByFile(orderedDomainChanges(domain, state))
	const grouped = new Set(groups.map(group => group.path))
	const wholeFiles = new Set(
		domain.members
			.filter(member => member.kind === 'file')
			.map(member => member.path),
	)
	const fileOnly = [...wholeFiles]
		.filter(path => !grouped.has(path))
		.map(path => ({ path, changes: [] }))
	return (
		<div>
			{[...groups, ...fileOnly].map(group => (
				<FileGroup
					key={group.path}
					path={group.path}
					changes={group.changes}
					isWholeFile={wholeFiles.has(group.path)}
					isCurrent={shown?.path === group.path}
					state={state}
				/>
			))}
		</div>
	)
}

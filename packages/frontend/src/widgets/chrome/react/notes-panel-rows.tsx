import * as stylex from '@stylexjs/stylex'
import { caption, tag } from '@syneva/design-system/controls.styles'

import { chromeCtx } from '../context'

import { note as row, notes as panel } from './notes-panel.styles'

import type { ReviewNote } from '@entities/review/notes'
import type { ReactElement } from 'react'

// The notes panel's row layer: one thread row (status, where, body, the agent's reply
// on an answered question), the per-file sections it groups into, and the two full-bleed
// empty states. Pure presentation - the visible list itself is derived by notesPanelView
// in @entities/review/notes and shared with the cursor logic in the facade.

function statusLabel(note: ReviewNote): string {
	if (note.status === 'resolved') return 'resolved'
	if (note.status === 'answered') return 'answered'
	return note.kind === 'question' ? 'waiting' : 'open'
}

// The status tag's tone: petrol while the thread waits on someone, green once the
// agent answered, neutral when settled.
const STATUS_TONES = {
	open: tag.accent,
	answered: tag.green,
	resolved: tag.neutral,
}

function whereLabel(note: ReviewNote): string {
	if (note.fileLevel) return 'file'
	const end = note.endLine && note.endLine !== note.lineNumber
	return `line ${note.lineNumber}${end ? `\u2013${note.endLine}` : ''}`
}

// The row's first line: where the thread sits, a lost anchor, its status.
function NoteTop({ note }: { note: ReviewNote }): ReactElement {
	return (
		<span {...stylex.props(row.top)}>
			<span {...stylex.props(row.where)}>{whereLabel(note)}</span>
			{note.unanchored && (
				<span {...stylex.props(row.flag)}>lost place</span>
			)}
			<span
				{...stylex.props(
					tag.base,
					STATUS_TONES[note.status],
					row.status,
				)}
			>
				{statusLabel(note)}
			</span>
		</span>
	)
}

export function NoteRow({
	note,
	index,
	current,
}: {
	note: ReviewNote
	index: number
	current: boolean
}): ReactElement {
	const { S } = chromeCtx()
	const cursor = index === S.notesCursor
	return (
		<button
			{...stylex.props(
				row.row,
				note.status === 'resolved' && row.resolved,
				cursor && row.cursor,
				current && row.current,
			)}
			data-status={note.status}
			data-cursor={cursor || undefined}
			data-current={current || undefined}
			onClick={() => {
				// Click and cursor stay one state: landing on a row moves the cursor onto it.
				S.notesCursor = index
				S.jumpToNote?.(note)
			}}
		>
			<NoteTop note={note} />
			<span {...stylex.props(row.clamp, row.body)}>{note.preview}</span>
			{note.kind === 'question' &&
				note.status === 'answered' &&
				note.latest && (
					<span {...stylex.props(row.clamp, row.reply)}>
						{note.latest}
					</span>
				)}
		</button>
	)
}

// Consecutive same-path notes become one file group; the cursor index keeps running ACROSS
// groups - it is the section's slice of the panel's flat visible rows (questions then
// comments; startIndex is where this section begins), so a restart per file would give
// several rows the same index and scramble the cursor.
function groupByFile(
	notes: ReviewNote[],
	startIndex: number,
): { path: string; rows: { note: ReviewNote; index: number }[] }[] {
	const groups: {
		path: string
		rows: { note: ReviewNote; index: number }[]
	}[] = []
	let next = startIndex
	for (const note of notes) {
		const entry = { note, index: next++ }
		const last = groups[groups.length - 1]
		if (last && last.path === note.path) last.rows.push(entry)
		else groups.push({ path: note.path, rows: [entry] })
	}
	return groups
}

// One file's rows under its sticky name.
function FileGroup({
	group,
	currentPath,
}: {
	group: ReturnType<typeof groupByFile>[number]
	currentPath: string | null
}): ReactElement {
	return (
		<div {...stylex.props(panel.file)}>
			<div {...stylex.props(panel.fileName)} title={group.path}>
				{group.path.split('/').pop()}
			</div>
			{group.rows.map(entry => (
				<NoteRow
					// A thread always carries its anchor comment; the composite
					// fallback keeps the key a string even if that invariant breaks.
					key={
						entry.note.comments[0]?.id ??
						`${entry.note.path}:${entry.index}`
					}
					note={entry.note}
					index={entry.index}
					current={entry.note.path === currentPath}
				/>
			))}
		</div>
	)
}

export function NoteSection({
	label,
	notes,
	startIndex,
	currentPath,
	empty,
}: {
	label: string
	notes: ReviewNote[]
	startIndex: number
	currentPath: string | null
	empty: string
}): ReactElement {
	return (
		<div {...stylex.props(panel.section)}>
			<div {...stylex.props(caption.base, caption.upper, panel.label)}>
				{label}
				{notes.length > 0 && (
					<span {...stylex.props(panel.labelCount)}>
						{notes.length}
					</span>
				)}
			</div>
			{!notes.length && <div {...stylex.props(panel.none)}>{empty}</div>}
			{/* Grouped by file, in the notes' review order (files arrive ordered). */}
			{groupByFile(notes, startIndex).map(group => (
				<FileGroup
					key={group.path}
					group={group}
					currentPath={currentPath}
				/>
			))}
		</div>
	)
}

export function NotesEmpty(): ReactElement {
	return (
		<div {...stylex.props(panel.empty)}>
			No comments or questions yet. Comment on a line or a file, or ask
			the agent a question.
		</div>
	)
}

export function NotesNoMatch(): ReactElement {
	const { S } = chromeCtx()
	return (
		<div {...stylex.props(panel.empty)}>
			No notes match the filter.
			<button
				{...stylex.props(panel.clear)}
				onClick={() => {
					S.setNotesQuery?.('')
					S.setNotesLens?.('all')
				}}
			>
				Clear filter
			</button>
		</div>
	)
}

import { useEffect, useRef } from 'react'

import { currentFileOrNull } from '@entities/review/changes'
import { domainThreads } from '@entities/review/domain-threads'
import {
	notesPanelView,
	reviewNotes,
	unresolvedNoteCount,
} from '@entities/review/notes'
import { useStoreFields } from '@shared/lib/use-store-version'
import { deskControl, segmented } from '@shared/ui/desk-control.styles'
import { Icon } from '@shared/ui/icon'
import { Kbd } from '@shared/ui/kbd'
import { tip } from '@shared/ui/tip.styles'
import * as stylex from '@stylexjs/stylex'
import { caption, control, tag } from '@syneva/design-system/controls.styles'
import { press } from '@syneva/design-system/press.styles'

import { chromeCtx } from '../context'

import { DomainNoteSection } from './notes-panel-domains'
import { NoteSection, NotesEmpty, NotesNoMatch } from './notes-panel-rows'
import { notes as styles } from './notes-panel.styles'

import type { DomainThread } from '@entities/review/domain-threads'
import type { NotesLens, ReviewNote } from '@entities/review/notes'
import type { KeyboardEvent, ReactElement, RefObject } from 'react'

const LENSES: { value: NotesLens; label: string }[] = [
	{ value: 'open', label: 'Open' },
	{ value: 'resolved', label: 'Resolved' },
	{ value: 'all', label: 'All' },
]

type StoreView = ReturnType<typeof chromeCtx>['S']

function activePath(S: StoreView): string | null {
	if (S.overviewOpen) return null
	return (
		currentFileOrNull(S.state?.files, S.preview, S.fileIndex)?.path ?? null
	)
}

function searchKeys(
	S: StoreView,
): (event: KeyboardEvent<HTMLInputElement>) => void {
	return event => {
		if (event.key === 'ArrowDown') {
			event.preventDefault()
			S.notesCursorMove?.(1)
		} else if (event.key === 'ArrowUp') {
			event.preventDefault()
			S.notesCursorMove?.(-1)
		} else if (event.key === 'Enter') {
			event.preventDefault()
			S.notesJumpCursor?.()
		}
	}
}

function NotesHead({ unresolved }: { unresolved: number }): ReactElement {
	const { S } = chromeCtx()
	return (
		<header {...stylex.props(styles.head)}>
			<span {...stylex.props(caption.base, caption.upper)}>
				Review notes
			</span>
			{unresolved > 0 && (
				<span {...stylex.props(tag.base, tag.accent)}>
					{unresolved} open
				</span>
			)}
			<button
				{...stylex.props(
					press.control,
					control.base,
					control.quiet,
					deskControl.mini,
					deskControl.iconMini,
					styles.close,
					tip.host,
					tip.end,
				)}
				data-tip="Close (Esc)"
				aria-label="Close review notes"
				onClick={() => {
					S.notesOpen = false
				}}
			>
				<Icon id="gly-close" />
			</button>
		</header>
	)
}

function NotesTools({
	inputRef,
}: {
	inputRef: RefObject<HTMLInputElement | null>
}): ReactElement {
	const { S } = chromeCtx()
	return (
		<div {...stylex.props(styles.tools)}>
			<div {...stylex.props(styles.search)}>
				<input
					{...stylex.props(styles.input)}
					ref={inputRef}
					value={S.notesQuery}
					placeholder="Filter notes"
					spellCheck={false}
					aria-label="Filter notes"
					onChange={event => S.setNotesQuery?.(event.target.value)}
					onKeyDown={searchKeys(S)}
				/>
				<Kbd keys="/" />
			</div>
			<div
				{...stylex.props(segmented.group)}
				role="group"
				aria-label="Note status"
			>
				{LENSES.map(lens => (
					<button
						key={lens.value}
						{...stylex.props(
							segmented.item,
							S.notesLens === lens.value && segmented.on,
						)}
						aria-pressed={S.notesLens === lens.value}
						onClick={() => S.setNotesLens?.(lens.value)}
					>
						{lens.label}
					</button>
				))}
			</div>
		</div>
	)
}

// The guide's threads under the panel's lens: open hides the resolved, resolved keeps only them; the query matches the target's names and the text.
function visibleThreads(
	threads: DomainThread[],
	view: { query: string; lens: NotesLens },
): DomainThread[] {
	const query = view.query.trim().toLowerCase()
	return threads.filter(thread => {
		if (view.lens === 'open' && thread.status === 'resolved') return false
		if (view.lens === 'resolved' && thread.status !== 'resolved')
			return false
		if (!query) return true
		const haystack = [
			thread.target.domainTitle,
			thread.target.blockTitle ?? '',
			...thread.messages.map(message => message.body),
		]
			.join(' ')
			.toLowerCase()
		return haystack.includes(query)
	})
}

type NoteLists = {
	questions: ReviewNote[]
	comments: ReviewNote[]
	flat: ReviewNote[]
	threads: DomainThread[]
}

function NotesBody({
	lists,
	currentPath,
	filtered,
}: {
	lists: NoteLists
	currentPath: string | null
	filtered: boolean
}): ReactElement {
	const { questions, comments, flat, threads } = lists
	if (!flat.length && !threads.length)
		return filtered ? <NotesNoMatch /> : <NotesEmpty />
	const sections = [
		{
			label: 'Questions',
			notes: questions,
			startIndex: 0,
			empty: 'No questions asked.',
		},
		{
			label: 'Comments',
			notes: comments,
			startIndex: questions.length,
			empty: 'No comments left.',
		},
	]
	return (
		<>
			{sections.map(section => (
				<NoteSection
					key={section.label}
					{...section}
					currentPath={currentPath}
				/>
			))}
			<DomainNoteSection threads={threads} />
		</>
	)
}

export function NotesPanel(): ReactElement {
	const { S } = chromeCtx()
	useStoreFields(
		'state',
		'fileIndex',
		'preview',
		'overviewOpen',
		'notesQuery',
		'notesLens',
		'notesCursor',
		'notesSearchTick',
	)
	const notes = reviewNotes(S.state)
	const view = { query: S.notesQuery, lens: S.notesLens }
	const { questions, comments, flat } = notesPanelView(S.state, view)
	const threads = visibleThreads(domainThreads(S.state), view)
	const openThreads = domainThreads(S.state).filter(
		thread => thread.status !== 'resolved',
	).length
	const inputRef = useRef<HTMLInputElement | null>(null)
	const searchTick = S.notesSearchTick
	const cursor = S.notesCursor
	const filtered = Boolean(S.notesQuery.trim()) || S.notesLens !== 'all'

	useEffect(() => {
		if (searchTick > 0) inputRef.current?.focus()
	}, [searchTick])

	// Open state lives in the store so the Esc cascade can close it (hotkeys-app) and a store bump mid-menu can't strand a closed-over local flag.
	const bodyRef = useRef<HTMLDivElement | null>(null)
	useEffect(() => {
		if (cursor > 0)
			bodyRef.current
				?.querySelector('[data-cursor]')
				?.scrollIntoView({ block: 'nearest' })
	}, [cursor])

	return (
		<aside {...stylex.props(styles.aside)}>
			<NotesHead unresolved={unresolvedNoteCount(notes) + openThreads} />
			<NotesTools inputRef={inputRef} />
			<div {...stylex.props(styles.body)} ref={bodyRef}>
				<NotesBody
					lists={{ questions, comments, flat, threads }}
					currentPath={activePath(S)}
					filtered={filtered}
				/>
			</div>
		</aside>
	)
}

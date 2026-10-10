import { isAnswered } from './answered'
import { isFileComment } from './changes'

import type { Side } from '@shared/diff-renderer/types'
import type { ReviewComment, ReviewState } from './model'

export type ReviewNote = {
	kind: 'question' | 'comment'
	path: string
	side: Side
	lineNumber: number
	endLine?: number
	fileLevel: boolean
	unanchored: boolean
	status: 'open' | 'answered' | 'resolved'
	preview: string
	latest: string
	updatedAt: string
	comments: ReviewComment[]
}

const PREVIEW_MAX = 120
const PREVIEW_HEAD = 117

function oneline(body: string): string {
	const text = body.replace(/\s+/g, ' ').trim()
	return text.length > PREVIEW_MAX ? `${text.slice(0, PREVIEW_HEAD)}…` : text
}

function threadStatus(
	group: ReviewComment[],
	kind: ReviewNote['kind'],
): ReviewNote['status'] {
	if (!group.some(c => c.status === 'open')) return 'resolved'
	if (kind === 'question' && isAnswered(group)) return 'answered'
	return 'open'
}

function toNote(group: [ReviewComment, ...ReviewComment[]]): ReviewNote {
	const [first] = group
	const last = group[group.length - 1] ?? first
	const kind = group.some(c => c.intent === 'question')
		? 'question'
		: 'comment'
	const note: ReviewNote = {
		kind,
		path: first.path,
		side: first.side,
		lineNumber: first.lineNumber,
		fileLevel: isFileComment(first),
		unanchored: group.some(c => c.unanchored === true),
		status: threadStatus(group, kind),
		preview: oneline(first.body),
		latest: oneline(last.body),
		updatedAt: last.updatedAt,
		comments: group,
	}
	if (typeof first.endLine === 'number') note.endLine = first.endLine
	return note
}

export function reviewNotes(state: ReviewState | null): ReviewNote[] {
	if (!state) return []
	const groups = new Map<string, ReviewComment[]>()
	for (const c of state.comments) {
		const key = isFileComment(c)
			? `${c.path}\u0000file`
			: `${c.path}\u0000${c.side}:${c.lineNumber}`
		const group = groups.get(key)
		if (group) group.push(c)
		else groups.set(key, [c])
	}
	const fileOrder = new Map<string, number>(
		state.files.map((f, i) => [f.path, i] as const),
	)
	return [...groups.values()]
		.map(group =>
			group.toSorted(
				(a, b) => +new Date(a.createdAt) - +new Date(b.createdAt),
			),
		)
		.filter(
			(group): group is [ReviewComment, ...ReviewComment[]] =>
				group.length > 0,
		)
		.map(toNote)
		.toSorted((a, b) => {
			const fa = fileOrder.get(a.path) ?? state.files.length
			const fb = fileOrder.get(b.path) ?? state.files.length
			if (fa !== fb) return fa - fb
			if (a.lineNumber !== b.lineNumber)
				return a.lineNumber - b.lineNumber
			return +new Date(a.updatedAt) - +new Date(b.updatedAt)
		})
}

export type NotesLens = 'all' | 'open' | 'resolved'

export type NotesView = { query: string; lens: NotesLens }

function matchesQuery(note: ReviewNote, query: string): boolean {
	const haystack = [
		note.path,
		note.preview,
		note.latest,
		note.fileLevel ? 'file' : `line ${note.lineNumber}`,
	]
		.join(' ')
		.toLowerCase()
	return haystack.includes(query)
}

export function filterNotes(
	notes: ReviewNote[],
	view: NotesView,
): ReviewNote[] {
	const query = view.query.trim().toLowerCase()
	return notes.filter(note => {
		if (view.lens === 'open' && note.status === 'resolved') return false
		if (view.lens === 'resolved' && note.status !== 'resolved') return false
		return !query || matchesQuery(note, query)
	})
}

export function notesPanelView(
	state: ReviewState | null,
	view: NotesView,
): { questions: ReviewNote[]; comments: ReviewNote[]; flat: ReviewNote[] } {
	const visible = filterNotes(reviewNotes(state), view)
	const questions = visible.filter(note => note.kind === 'question')
	const comments = visible.filter(note => note.kind === 'comment')
	return { questions, comments, flat: [...questions, ...comments] }
}

export function unresolvedNoteCount(notes: ReviewNote[]): number {
	return notes.filter(note => note.status !== 'resolved').length
}

export type NoteThreadRef = Pick<
	ReviewNote,
	'path' | 'side' | 'lineNumber' | 'fileLevel'
>

export function sameThread(a: NoteThreadRef, b: NoteThreadRef): boolean {
	return (
		a.path === b.path &&
		a.side === b.side &&
		a.lineNumber === b.lineNumber &&
		a.fileLevel === b.fileLevel
	)
}

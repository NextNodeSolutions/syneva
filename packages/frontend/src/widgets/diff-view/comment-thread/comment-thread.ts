import { toDisplayLine } from '@entities/review/changes'
import { deleteComment, editComment } from '@features/manage-comment/comments'
import {
	buildComposer,
	buildEditor,
	composerTargets,
	openComposer,
	openFileComposer,
} from '@features/manage-comment/composer'
import { cx } from '@shared/lib/cx'
import { esc } from '@shared/lib/esc'
import { notifyStateMutation } from '@shared/lib/reactive'
import { render } from '@shared/lib/render-scheduler'
import { markdownRevision, renderCommentBody } from '@shared/markdown'
import { deskControl } from '@shared/ui/desk-control.styles'
import { control, tag } from '@syneva/design-system/controls.styles'
import { press } from '@syneva/design-system/press.styles'

import { awaitingHtml } from '../awaiting'
import { diffCtx } from '../context'
import { D } from '../runtime'

import { thread as s } from './comment-thread.styles'
import { messageMarker } from './comment-thread.stylex'

import type { ThreadMeta } from '@entities/review/annotations'
import type { ReviewComment } from '@entities/review/model'

const MILLISECONDS_PER_SECOND = 1000
const NOW_WINDOW_S = 45
const SECONDS_PER_MINUTE = 60
const MINUTES_PER_HOUR = 60
const HOURS_PER_DAY = 24
const DAYS_PER_WEEK = 7

function relTime(iso?: string): string {
	if (!iso) return ''
	const t = +new Date(iso)
	if (!Number.isFinite(t)) return ''
	const elapsedS = Math.max(0, (Date.now() - t) / MILLISECONDS_PER_SECOND)
	if (elapsedS < NOW_WINDOW_S) return 'now'
	const elapsedMin = elapsedS / SECONDS_PER_MINUTE
	if (elapsedMin < MINUTES_PER_HOUR) return `${Math.round(elapsedMin)}m ago`
	const elapsedH = elapsedMin / MINUTES_PER_HOUR
	if (elapsedH < HOURS_PER_DAY) return `${Math.round(elapsedH)}h ago`
	const elapsedD = elapsedH / HOURS_PER_DAY
	if (elapsedD < DAYS_PER_WEEK) return `${Math.round(elapsedD)}d ago`
	return new Date(iso).toLocaleDateString()
}

const MINI = [press.control, control.base, deskControl.mini]
const REPLY = cx(MINI, control.outlined)
const RESOLVE = cx(MINI, deskControl.resolve)
const REOPEN = cx(MINI, deskControl.request)
const EDIT = cx(MINI, control.quiet, s.messageAction)
const DELETE = cx(MINI, deskControl.dangerHint, s.messageAction)

function intentBadge(message: ReviewComment, isOwn: boolean): string {
	if (!isOwn) return ''
	if (message.intent === 'question')
		return `<span class="${cx(tag.base, tag.accent)}">Question</span>`
	if (message.intent === 'action')
		return `<span class="${cx(tag.base, tag.amber)}">Change requested</span>`
	return ''
}

function messageHtml(message: ReviewComment, thread: ThreadMeta): string {
	const isOwn = message.role !== 'agent'
	const isEditing = diffCtx().S.editingCommentId === message.id
	const isEdited =
		message.updatedAt &&
		message.createdAt &&
		message.updatedAt !== message.createdAt
	const edited = isEdited ? ' · edited' : ''
	const badge = intentBadge(message, isOwn)
	const isAwaiting =
		isOwn &&
		message.intent === 'question' &&
		!thread.comments.some(
			x =>
				x.role === 'agent' &&
				+new Date(x.createdAt) > +new Date(message.createdAt),
		)
	const actions =
		isOwn && !isEditing
			? `<span class="${cx(s.messageActions)}"><button class="${EDIT}" data-thread-action="edit" data-id="${message.id}">Edit</button><button class="${DELETE}" data-thread-action="delete" data-id="${message.id}">Delete</button></span>`
			: ''
	const body = isEditing
		? ''
		: `<div class="${cx(s.body)}" data-prose="thread">${renderCommentBody(message)}</div>`
	const card = cx(
		s.message,
		messageMarker,
		!isOwn && s.messageAgent,
		isEditing && s.messageEditing,
	)
	const author = cx(s.author, !isOwn && s.authorAgent)
	return `<div class="${card}" data-message-id="${message.id}"><div class="${cx(s.meta)}"><span class="${author}">${isOwn ? 'You' : 'Agent'}</span>${badge}<time class="${cx(s.time)}">${esc(relTime(message.createdAt))}${edited}</time>${actions}</div>${body}${isAwaiting ? awaitingHtml() : ''}</div>`
}

function messagesHtml(thread: ThreadMeta): string {
	if (thread.status !== 'resolved')
		return thread.comments.map(m => messageHtml(m, thread)).join('')
	const count = thread.comments.length
	const plural = count === 1 ? '' : 's'
	return `<div class="${cx(s.summary)}"><b class="${cx(s.summaryCount)}">${count}</b> comment${plural} <span>(Resolved)</span><button class="${cx(MINI, deskControl.request, s.summaryReopen)}" data-thread-action="reopen">Reopen</button></div>`
}

function threadFoot(thread: ThreadMeta, isReplyOpen: boolean): string {
	const reopen = `<button class="${REOPEN}" data-thread-action="reopen">Reopen</button>`
	const resolve = `<button class="${RESOLVE}" data-thread-action="resolve">Resolve</button>`
	const reply = `<button class="${REPLY}" data-thread-action="reply">Reply</button>`
	if (thread.status === 'resolved')
		return `<div class="${cx(s.foot, s.footHidden)}" data-thread-foot>${reopen}</div>`
	if (isReplyOpen)
		return `<div class="${cx(s.foot)}" data-thread-foot>${resolve}</div>`
	return `<div class="${cx(s.foot)}" data-thread-foot>${reply}${resolve}</div>`
}

function setThreadStatus(
	thread: ThreadMeta,
	status: ReviewComment['status'],
): void {
	for (const comment of diffCtx().requireState().comments) {
		const isSameAnchor =
			comment.path === thread.path &&
			comment.side === thread.side &&
			comment.lineNumber === thread.lineNumber
		if (isSameAnchor) comment.status = status
	}
	notifyStateMutation()
}

function isReplyComposerOpen(thread: ThreadMeta): boolean {
	if (thread.fileLevel)
		return (
			diffCtx().S.fileComposerOpen &&
			!diffCtx().S.editingCommentId &&
			thread.status === 'open'
		)
	return composerTargets(thread.side, thread.lineNumber)
}

function wireThreadActions(box: HTMLElement, thread: ThreadMeta): void {
	const reply = box.querySelector<HTMLButtonElement>(
		'[data-thread-action="reply"]',
	)
	reply?.addEventListener('click', () => {
		if (thread.fileLevel) {
			openFileComposer()
			return
		}
		diffCtx().S.selected = {
			side: thread.side,
			lineNumber: toDisplayLine(
				thread.side,
				thread.lineNumber,
				D.lineMap,
			),
		}
		openComposer()
	})
	for (const button of box.querySelectorAll<HTMLButtonElement>(
		'[data-thread-action="edit"]',
	)) {
		const { id } = button.dataset
		if (id) button.addEventListener('click', () => editComment(id))
	}
	for (const button of box.querySelectorAll<HTMLButtonElement>(
		'[data-thread-action="delete"]',
	)) {
		const { id } = button.dataset
		if (id) button.addEventListener('click', () => deleteComment(id))
	}
	box.querySelector<HTMLButtonElement>(
		'[data-thread-action="resolve"]',
	)?.addEventListener('click', () => resolveThread(thread))
	for (const button of box.querySelectorAll<HTMLButtonElement>(
		'[data-thread-action="reopen"]',
	)) {
		button.addEventListener('click', () => reopenThread(thread))
	}
}

function resolveThread(thread: ThreadMeta): void {
	diffCtx().S.noteResolved?.({
		path: thread.path,
		side: thread.side,
		lineNumber: thread.lineNumber,
		fileLevel: Boolean(thread.fileLevel),
	})
	setThreadStatus(thread, 'resolved')
	void render()
	diffCtx().toast('Resolved')
	diffCtx().persist()
}

function reopenThread(thread: ThreadMeta): void {
	setThreadStatus(thread, 'open')
	void render()
	diffCtx().toast('Reopened')
	diffCtx().persist()
}

export function threadSignature(thread: ThreadMeta): string {
	const editingId = diffCtx().S.editingCommentId
	return JSON.stringify([
		thread.path,
		thread.side,
		thread.lineNumber,
		thread.status,
		thread.changeId ?? '',
		Boolean(thread.fileLevel),
		thread.comments.map(message => [
			message.id,
			message.body,
			message.status,
			message.role,
			message.intent ?? '',
			message.createdAt,
			message.updatedAt,
			relTime(message.createdAt),
		]),
		thread.comments.some(message => message.id === editingId)
			? editingId
			: '',
		isReplyComposerOpen(thread),
		markdownRevision(),
	])
}

export function buildCommentThread(thread: ThreadMeta): HTMLElement {
	const box = document.createElement('div')
	box.className = cx(s.box, thread.status === 'resolved' && s.boxResolved)
	const isReplyOpen = isReplyComposerOpen(thread)
	box.innerHTML = `${messagesHtml(thread)}${threadFoot(thread, isReplyOpen)}`
	if (diffCtx().S.editingCommentId && thread.status !== 'resolved') {
		const message = box.querySelector(
			`[data-message-id="${diffCtx().S.editingCommentId}"]`,
		)
		message?.appendChild(buildEditor())
	}
	if (isReplyOpen && thread.status !== 'resolved')
		box.querySelector('[data-thread-foot]')?.before(buildComposer())
	wireThreadActions(box, thread)
	return box
}

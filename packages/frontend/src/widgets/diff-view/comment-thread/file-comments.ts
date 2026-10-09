import {
	currentFileComments,
	currentFileOrNull,
} from '@entities/review/changes'
import { guideInputs, hasGuide } from '@entities/review/guide/guide'
import { buildComposer } from '@features/manage-comment/composer'
import { cx } from '@shared/lib/cx'
import { count, deskControl } from '@shared/ui/desk-control.styles'
import { iconHtml } from '@shared/ui/icon-html'
import { icon } from '@shared/ui/icon.styles'
import { tip } from '@shared/ui/tip.styles'
import { control } from '@syneva/design-system/controls.styles'
import { press } from '@syneva/design-system/press.styles'

import { diffCtx } from '../context'

import { buildCommentThread } from './comment-thread'
import { annotation } from './comment-thread.styles'
import { fileComments } from './file-comments.styles'

import type { ThreadMeta } from '@entities/review/annotations'
import type { StaticStyle } from '@shared/lib/cx'

export function fileThreadMeta(): ThreadMeta | null {
	const comments = currentFileComments(
		diffCtx().S.state,
		currentFileOrNull(
			diffCtx().S.state?.files,
			diffCtx().S.preview,
			diffCtx().S.fileIndex,
		),
	)
	if (!comments.length) return null
	const [first] = comments
	if (!first) return null
	return {
		type: 'thread',
		path: first.path,
		side: first.side,
		lineNumber: first.lineNumber,
		status: comments.some(c => c.status === 'open') ? 'open' : 'resolved',
		comments,
		fileLevel: true,
	}
}

export function fileCommentsEnabled(): boolean {
	return diffCtx().S.state?.mode !== 'file'
}

export type FileCommentPlacement = 'header' | 'card' | 'bar'

function triggerStyle(
	placement: FileCommentPlacement,
	isOpen: boolean,
): StaticStyle {
	const isHeader = placement === 'header'
	const closedTone = isHeader ? control.quiet : control.outlined
	return [
		press.control,
		control.base,
		isOpen ? deskControl.ask : closedTone,
		deskControl.mini,
		isHeader ? deskControl.iconMini : fileComments.tile,
		tip.host,
	]
}

export function fileCommentIconButton(
	placement: FileCommentPlacement,
): HTMLElement {
	const isOpen = diffCtx().S.fileComposerOpen
	const b = document.createElement('button')
	b.className = cx(triggerStyle(placement, isOpen))
	b.dataset.fileCommentTrigger = ''
	b.setAttribute('aria-pressed', String(isOpen))
	b.setAttribute(
		'data-tip',
		isOpen ? 'Close file comment (⇧C)' : 'Comment on file (⇧C)',
	)
	const glyph = iconHtml(
		'gly-comment',
		placement === 'header' ? icon.small : null,
	)
	const open = currentFileComments(
		diffCtx().S.state,
		currentFileOrNull(
			diffCtx().S.state?.files,
			diffCtx().S.preview,
			diffCtx().S.fileIndex,
		),
	).filter(c => c.status === 'open' && c.role !== 'agent').length
	b.innerHTML = open
		? `${glyph}<span class="${cx(count.base, count.corner)}">${open}</span>`
		: glyph
	b.addEventListener('click', () => diffCtx().S.toggleFileComposer?.())
	return b
}

// The whole-file trigger the file header and the oversized card carry: under a guide the guide bar carries it instead, and a single-file desk has nothing to address.
export function fileCommentButton(
	placement: Extract<FileCommentPlacement, 'header' | 'card'>,
): HTMLElement | null {
	if (hasGuide(guideInputs(diffCtx().S)) || !fileCommentsEnabled())
		return null
	return fileCommentIconButton(placement)
}

function isStandaloneComposerOpen(): boolean {
	if (!diffCtx().S.fileComposerOpen || diffCtx().S.editingCommentId)
		return false
	return fileThreadMeta()?.status !== 'open'
}

function standaloneComposer(isRuled: boolean): HTMLElement | null {
	if (!isStandaloneComposerOpen()) return null
	const wrap = document.createElement('div')
	wrap.className = cx(
		annotation.slot,
		annotation.composer,
		isRuled && fileComments.rule,
	)
	wrap.appendChild(buildComposer())
	return wrap
}

function threadBox(thread: ThreadMeta, isRuled: boolean): HTMLElement {
	const box = document.createElement('div')
	box.className = cx(
		annotation.slot,
		thread.status === 'resolved' && annotation.resolved,
		isRuled && fileComments.rule,
	)
	box.dataset.fileThread = String(thread.lineNumber)
	box.appendChild(buildCommentThread(thread))
	return box
}

type SectionPlacement = 'header' | 'card' | 'document'

export function fileCommentSection(
	placement: Exclude<SectionPlacement, 'document'> = 'header',
): HTMLElement | null {
	if (!fileThreadMeta() && !isStandaloneComposerOpen()) return null
	return buildSection(null, placement)
}

export function markdownFileCommentStrip(): HTMLElement | null {
	if (!fileCommentsEnabled()) {
		if (!fileThreadMeta()) return null
		return buildSection(null, 'document')
	}
	return buildSection(markdownBar(), 'document')
}

function markdownBar(): HTMLElement {
	const bar = document.createElement('div')
	bar.className = cx(fileComments.bar)
	bar.appendChild(fileCommentIconButton('bar'))
	const label = document.createElement('span')
	label.className = cx(fileComments.label)
	label.textContent = `Comment on ${
		currentFileOrNull(
			diffCtx().S.state?.files,
			diffCtx().S.preview,
			diffCtx().S.fileIndex,
		)
			?.path.split('/')
			.pop() ?? 'this file'
	}`
	bar.appendChild(label)
	return bar
}

function buildSection(
	bar: HTMLElement | null,
	placement: SectionPlacement,
): HTMLElement {
	const section = document.createElement('div')
	section.className = cx(
		fileComments.section,
		placement === 'card' && fileComments.onCard,
		placement === 'document' && fileComments.inDocument,
	)
	section.dataset.fileComments = ''
	if (bar) section.appendChild(bar)
	const thread = fileThreadMeta()
	if (thread) section.appendChild(threadBox(thread, section.hasChildNodes()))
	const composer = standaloneComposer(section.hasChildNodes())
	if (composer) section.appendChild(composer)
	return section
}

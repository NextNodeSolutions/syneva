import {
	currentFile,
	currentComments,
	isFileComment,
	currentFileOrNull,
} from '@entities/review/changes'
import { cur } from '@entities/review/file/contents'
import { buildComposer, openComposer } from '@features/manage-comment/composer'
import { cx } from '@shared/lib/cx'
import { $ } from '@shared/lib/dom'
import { renderFileMarkdown } from '@shared/markdown'

import { buildCommentThread } from './comment-thread/comment-thread'
import { annotation } from './comment-thread/comment-thread.styles'
import { markdownFileCommentStrip } from './comment-thread/file-comments'
import { diffCtx } from './context'
import { mdFile } from './mdfile.styles'

import type { ReviewComment } from '@entities/review/model'
import type { StaticStyle } from '@shared/lib/cx'

function openComposerAt(lineNumber: number): void {
	diffCtx().S.selected = { side: 'additions', lineNumber }
	openComposer()
}

function isAnchor(el: Element): boolean {
	return (
		el.hasAttribute('data-line') &&
		el.tagName !== 'UL' &&
		el.tagName !== 'OL'
	)
}

function createMarkdownContainer(): HTMLElement {
	const container = document.createElement('div')
	container.className = cx(mdFile.document)
	container.dataset.prose = 'document'
	$('diff').replaceChildren(container)
	return container
}

const ANCHOR = cx(mdFile.anchor).split(' ')

function markAnchors(container: HTMLElement): HTMLElement[] {
	const anchors = [
		...container.querySelectorAll<HTMLElement>('[data-line]'),
	].filter(isAnchor)
	for (const el of anchors) {
		el.classList.add(...ANCHOR)
		el.title = 'Click to comment'
	}
	return anchors
}

function attachBlockCommentHandler(container: HTMLElement): void {
	container.addEventListener('click', event => {
		const { target } = event
		if (!(target instanceof Element)) return
		if (
			target.closest(
				'a, button, input, [data-md-thread], [data-file-comments]',
			)
		)
			return
		if (!window.getSelection()?.isCollapsed) return
		const el = target.closest<HTMLElement>('[data-line]')
		if (!el || !isAnchor(el)) return
		openComposerAt(Number(el.dataset.line))
	})
}

function placeAt(
	container: HTMLElement,
	anchor: HTMLElement | null,
	node: HTMLElement,
): void {
	if (!anchor) container.appendChild(node)
	else if (isListItem(anchor)) anchor.appendChild(node)
	else anchor.after(node)
}

function isListItem(anchor: HTMLElement | null): boolean {
	return anchor?.tagName === 'LI'
}

function threadSlot(
	anchor: HTMLElement | null,
	...styles: StaticStyle[]
): HTMLElement {
	const slot = document.createElement('div')
	slot.className = cx(
		annotation.slot,
		mdFile.thread,
		isListItem(anchor) && mdFile.threadInItem,
		...styles,
	)
	slot.dataset.mdThread = ''
	return slot
}

function groupCommentsByLine(
	comments: ReviewComment[],
): Map<number, ReviewComment[]> {
	const byLine = new Map<number, ReviewComment[]>()
	for (const c of comments) {
		if (isFileComment(c)) continue
		const thread = byLine.get(c.lineNumber)
		if (thread) thread.push(c)
		else byLine.set(c.lineNumber, [c])
	}
	for (const thread of byLine.values())
		thread.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt))
	return byLine
}

function overlayThreads(
	container: HTMLElement,
	anchors: HTMLElement[],
	threadsByLine: Map<number, ReviewComment[]>,
	path: string,
): void {
	for (const [lineNumber, comments] of threadsByLine) {
		const anchor = anchorForLine(anchors, lineNumber)
		const status = comments.some(c => c.status === 'open')
			? 'open'
			: 'resolved'
		const thread = threadSlot(
			anchor,
			status === 'resolved' && annotation.resolved,
		)
		thread.appendChild(
			buildCommentThread({
				type: 'thread',
				path,
				side: 'additions',
				lineNumber,
				status,
				comments,
			}),
		)
		placeAt(container, anchor, thread)
	}
}

function overlayComposer(
	container: HTMLElement,
	anchors: HTMLElement[],
	threadsByLine: Map<number, ReviewComment[]>,
): void {
	const { composerOpen, editingCommentId, selected } = diffCtx().S
	if (
		!composerOpen ||
		editingCommentId ||
		threadsByLine.has(selected.lineNumber)
	)
		return
	const anchor = anchorForLine(anchors, selected.lineNumber)
	const card = threadSlot(anchor, annotation.composer)
	card.appendChild(buildComposer())
	placeAt(container, anchor, card)
}

export function renderMarkdownFile(): void {
	const { path } = currentFile(
		diffCtx().S.state?.files,
		diffCtx().S.preview,
		diffCtx().S.fileIndex,
	)
	const container = createMarkdownContainer()
	container.innerHTML = renderFileMarkdown(cur.newContents)
	const anchors = markAnchors(container)
	attachBlockCommentHandler(container)
	const threadsByLine = groupCommentsByLine(
		currentComments(
			diffCtx().S.state,
			currentFileOrNull(
				diffCtx().S.state?.files,
				diffCtx().S.preview,
				diffCtx().S.fileIndex,
			),
		),
	)
	overlayThreads(container, anchors, threadsByLine, path)
	overlayComposer(container, anchors, threadsByLine)
	const strip = markdownFileCommentStrip()
	if (strip) container.insertBefore(strip, container.firstChild)
}

function anchorForLine(
	anchors: HTMLElement[],
	line: number,
): HTMLElement | null {
	let best: HTMLElement | null = null
	let bestLine = -1
	for (const el of anchors) {
		const { line: anchorLine } = el.dataset
		const startLine = Number(anchorLine)
		if (startLine > line || startLine <= bestLine) continue
		best = el
		bestLine = startLine
	}
	return best ?? anchors.at(0) ?? null
}

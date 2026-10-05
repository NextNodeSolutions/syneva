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

// A markdown-block line has no display/raw split (D.lineMap is null here), so the source
// line is the anchor directly. The composer renders inline via renderMarkdownFile below.
function openComposerAt(lineNumber: number): void {
	diffCtx().S.selected = { side: 'additions', lineNumber }
	openComposer()
}

// A commentable block is any element carrying a source line, except the list
// containers themselves (you comment on the individual <li>, not the whole list).
function isAnchor(el: Element): boolean {
	return (
		el.hasAttribute('data-line') &&
		el.tagName !== 'UL' &&
		el.tagName !== 'OL'
	)
}

// The formatted markdown gets its own child of #diff, so the overlays below have a
// container that survives them (they append/insert siblings around the blocks). The rendered
// HTML is not ours to class: data-prose="document" carries its typography (prose.css).
function createMarkdownContainer(): HTMLElement {
	const container = document.createElement('div')
	container.className = cx(mdFile.document)
	container.dataset.prose = 'document'
	$('diff').replaceChildren(container)
	return container
}

// The anchor's atomic classes, added onto whatever the markdown output already put on the block
// (task-list and shiki classes): they set only the click affordance.
const ANCHOR = cx(mdFile.anchor).split(' ')

// Mark every commentable block, and return them in document order - the overlay below
// resolves a comment's line to the last block starting at or before it.
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

// Click anywhere on a block to comment on it (ignore text selection, links, and clicks
// inside an existing thread or the whole-file comment strip - their rendered bodies carry
// data-line too). Delegated so it survives the per-render rebuild.
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
		if (!window.getSelection()?.isCollapsed) return // user is selecting text
		const el = target.closest<HTMLElement>('[data-line]')
		if (!el || !isAnchor(el)) return // clicked the list container gutter, not an item
		openComposerAt(Number(el.dataset.line))
	})
}

// A comment's own block: inside the <li> for list items (indented under the item), after
// the block otherwise - and appended to the end when its line has no block (a stale
// anchor, e.g. the block was edited away while the comment stayed).
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

// The inline box a thread or a new comment's composer hangs in. Its placement is known before
// it is built (placeAt), so a box tucked into a list item takes that style up front.
// data-md-thread keeps a click inside it from opening another composer.
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

// Comments grouped by the source line they anchor to, each thread oldest-first. Whole-file
// comments address the file as a whole and are hosted by markdownFileCommentStrip, so they
// never join a block group.
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

// Existing comment threads, overlaid at each comment's source line.
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
		// A resolved thread dims and folds to its summary here as it does in the diff.
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

// A new line comment (no existing thread on that line) opens an inline composer under
// its block; a reply/edit renders inside the thread above via buildCommentThread.
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

// Render the current markdown file as formatted HTML in #diff, with click-to-comment on
// each block and existing comment threads overlaid at their source line. Replaces the
// @pierre/diffs view; comments are still plain line-anchored ReviewComments, plus the whole-file
// comment strip at the top (the rendered view replaces the file header entirely).
export function renderMarkdownFile(): void {
	const { path } = currentFile(
		diffCtx().S.state?.files,
		diffCtx().S.preview,
		diffCtx().S.fileIndex,
	)
	const container = createMarkdownContainer()
	// Contents come from the per-file fetch (render() awaits it before this runs); `cur` holds
	// the current file's new-side bytes.
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
	// The file-comment strip leads the flow (a comment on the file addresses its first block too);
	// null on a single-file desk with no whole-file comments.
	const strip = markdownFileCommentStrip()
	if (strip) container.insertBefore(strip, container.firstChild)
}

// The anchor whose data-line is the largest value <= line (the block the comment sits in).
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

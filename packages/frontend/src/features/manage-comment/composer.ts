import { fromDisplayLine } from '@entities/review/changes'
import { featureCtx } from '@features/context'
import { cx } from '@shared/lib/cx'
import { $ } from '@shared/lib/dom'
import { render } from '@shared/lib/render-scheduler'
import { deskControl } from '@shared/ui/desk-control.styles'
import { kbdHtml } from '@shared/ui/kbd-html'
import { control } from '@syneva/design-system/controls.styles'
import { kbd } from '@syneva/design-system/inline.styles'
import { press } from '@syneva/design-system/press.styles'

import { composer } from './composer.styles'

import type { Side } from '@shared/diff-renderer/types'
import type { StaticStyle } from '@shared/lib/cx'

// The composer is imperative DOM inside the diff: a new comment is a `composer` annotation at the selected line, a reply a card at its thread's bottom, an edit a body swap in place - one open at a time.
// Its text lives in the store (composerBody) so it survives render()'s diff-DOM rebuild, caret and focus restored after each render; hooks are data attributes (class names are hashed).

const SETTLE_TIMEOUT_MS = 200

let composerCaret = 0
let needsWindowFocus = false

function trackInput(ta: HTMLTextAreaElement): void {
	ta.addEventListener('input', () => {
		featureCtx().S.composerBody = ta.value
		composerCaret = ta.selectionStart
	})
	const syncCaret = (): void => {
		composerCaret = ta.selectionStart
	}
	ta.addEventListener('keyup', syncCaret)
	ta.addEventListener('click', syncCaret)
}

function composerCard(
	cardStyle: StaticStyle,
	inputStyle: StaticStyle,
): { card: HTMLElement; ta: HTMLTextAreaElement } {
	const card = document.createElement('div')
	card.className = cx(cardStyle)
	card.dataset.composer = ''
	const ta = document.createElement('textarea')
	ta.className = cx(inputStyle)
	ta.dataset.composerFocus = ''
	ta.value = featureCtx().S.composerBody
	trackInput(ta)
	card.appendChild(ta)
	return { card, ta }
}

const MINI = [press.control, control.base, deskControl.mini]
const SPACER = `<span class="${cx(composer.spacer)}"></span>`

function actionButton(
	action: string,
	label: string,
	tone: StaticStyle,
	keys?: string,
): string {
	const chip = keys ? kbdHtml(keys, kbd.onTint) : ''
	return `<button class="${cx(MINI, tone)}" data-composer-action="${action}">${label}${chip}</button>`
}

function wireButtons(
	row: HTMLElement,
	handlers: Record<string, () => void>,
): void {
	for (const [action, handler] of Object.entries(handlers)) {
		const btn = row.querySelector<HTMLButtonElement>(
			`[data-composer-action="${action}"]`,
		)
		if (btn) btn.addEventListener('click', handler)
	}
}

export function buildComposer(): HTMLElement {
	const { card } = composerCard(composer.card, composer.input)
	const row = document.createElement('div')
	row.className = cx(composer.row)
	row.innerHTML = `${SPACER}${actionButton('ask', 'Ask', deskControl.ask, '⌘⇧↵')}${actionButton('request', 'Request change', deskControl.request, '⌘↵')}`
	wireButtons(row, {
		ask: () => featureCtx().S.ask?.(),
		request: () => featureCtx().S.requestChange?.(),
	})
	card.appendChild(row)
	return card
}

export function buildEditor(): HTMLElement {
	const { card } = composerCard(null, composer.edit)
	const row = document.createElement('div')
	row.className = cx(composer.row, composer.editRow)
	row.innerHTML = `${SPACER}${actionButton('cancel', 'Cancel', control.quiet)}${actionButton('save', 'Save', deskControl.request, '⌘↵')}`
	wireButtons(row, {
		cancel: () => closeComposer(),
		save: () => featureCtx().S.saveComment?.(),
	})
	card.appendChild(row)
	return card
}

// F.S.selected is display space on the diff but identity in the markdown view (lineMap() is null), so convert before comparing against a thread's raw anchor.
export function composerTargets(side: Side, rawLine: number): boolean {
	return (
		featureCtx().S.composerOpen &&
		!featureCtx().S.editingCommentId &&
		featureCtx().S.selected.side === side &&
		fromDisplayLine(
			featureCtx().S.selected.side,
			featureCtx().S.selected.lineNumber,
			featureCtx().lineMap(),
		) === rawLine
	)
}

export function openComposer(): void {
	composerCaret = 0
	featureCtx().S.composerBody = ''
	featureCtx().S.editingCommentId = null
	featureCtx().S.composerOpen = true
	featureCtx().S.fileComposerOpen = false
	needsWindowFocus = true
	void render()
}

export function openFileComposer(): void {
	composerCaret = 0
	featureCtx().S.composerBody = ''
	featureCtx().S.editingCommentId = null
	featureCtx().S.composerOpen = false
	featureCtx().S.fileComposerOpen = true
	needsWindowFocus = true
	void render()
}

export function toggleFileComposer(): void {
	if (featureCtx().S.fileComposerOpen) {
		featureCtx().S.composerBody = ''
		closeFileComposer()
		return
	}
	openFileComposer()
}

// Closing rebuilds the diff (imperative DOM, not a flag toggle); `isDeferred` waits for the click
// to settle first: the outside-click close fires on pointerdown but the browser dispatches `click`
// ~50-150ms later, and a render in that window destroys the press's target and silently drops the
// click. A macrotask is not enough (it fires while the button is still held), so wait for the click
// itself to bubble to the document, with a timeout fallback for pointerdowns that never become
// clicks (drags).
export function closeComposer(isDeferred = false): void {
	featureCtx().S.composerOpen = false
	needsWindowFocus = false
	featureCtx().S.editingCommentId = null
	rebuildAfterClose(isDeferred)
}

export function closeFileComposer(isDeferred = false): void {
	featureCtx().S.fileComposerOpen = false
	needsWindowFocus = false
	featureCtx().S.editingCommentId = null
	rebuildAfterClose(isDeferred)
}

function rebuildAfterClose(isDeferred: boolean): void {
	if (!isDeferred) {
		void render()
		return
	}
	let timer = 0
	const settle = (): void => {
		clearTimeout(timer)
		document.removeEventListener('click', settle)
		void render()
	}
	timer = window.setTimeout(settle, SETTLE_TIMEOUT_MS)
	document.addEventListener('click', settle)
}

export function restorePendingComposerFocus(): void {
	if (needsWindowFocus) restoreComposerFocus()
}

export function restoreComposerFocus(): void {
	if (!featureCtx().S.composerOpen && !featureCtx().S.fileComposerOpen) return
	const ta = document.querySelector<HTMLTextAreaElement>(
		'[data-composer-focus]',
	)
	if (!ta?.getClientRects().length) {
		needsWindowFocus = true
		return
	}
	needsWindowFocus = false
	if (ta.value !== featureCtx().S.composerBody)
		ta.value = featureCtx().S.composerBody
	ta.focus({ preventScroll: true })
	const pane = $('diff').getBoundingClientRect()
	const box = ta.getBoundingClientRect()
	if (box.top < pane.top) $('diff').scrollTop += box.top - pane.top
	else if (box.bottom > pane.bottom)
		$('diff').scrollTop += box.bottom - pane.bottom
	const pos = Math.min(composerCaret, ta.value.length)
	ta.setSelectionRange(pos, pos)
}

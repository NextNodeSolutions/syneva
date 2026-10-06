import { isFileComment, toDisplayLine } from '@entities/review/changes'
import { revealLine } from '@features/expand-context/expand'
import { cx } from '@shared/lib/cx'
import { $ } from '@shared/lib/dom'
import { isMotionReduced } from '@shared/lib/motion'

import { jump } from './comment-jump.styles'
import { cursorJumpTo } from './cursor'
import { D } from './runtime'

import type { ReviewFile } from '@entities/review/model'
import type { Side } from '@shared/diff-renderer/types'

export type JumpTarget = {
	path: string
	side: Side
	lineNumber: number
	fileLevel: boolean
	unanchored: boolean
}

const FLASH = cx(jump.flash).split(' ')

function flash(el: HTMLElement): void {
	el.classList.remove(...FLASH)
	void el.offsetWidth
	el.classList.add(...FLASH)
}

function scrollAndFlash(selector: string, fallbackSelector?: string): void {
	const el = $('diff').querySelector<HTMLElement>(selector)
	const target =
		el ??
		(fallbackSelector
			? $('diff').querySelector<HTMLElement>(fallbackSelector)
			: null)
	target?.scrollIntoView({
		block: 'center',
		behavior: isMotionReduced() ? 'auto' : 'smooth',
	})
	if (el) flash(el)
}

export function jumpToThread(file: ReviewFile | null, t: JumpTarget): void {
	if (!file || file.path !== t.path) return
	if (t.fileLevel) {
		scrollAndFlash('[data-file-comments] [data-file-thread]')
		return
	}
	if (t.unanchored) {
		scrollAndFlash(
			`[data-unanchored] [data-thread="${t.side}:${t.lineNumber}"]`,
			'[data-unanchored]',
		)
		return
	}
	revealLine(t.side, t.lineNumber)
	cursorJumpTo(t.side, toDisplayLine(t.side, t.lineNumber, D.lineMap))
}

export function jumpTargetFor(comment: {
	path: string
	side: Side
	lineNumber: number
	unanchored?: boolean
}): JumpTarget {
	return {
		path: comment.path,
		side: comment.side,
		lineNumber: comment.lineNumber,
		fileLevel: isFileComment(comment),
		unanchored: comment.unanchored === true,
	}
}

let pending: JumpTarget | null = null

export function setPendingJump(t: JumpTarget): void {
	pending = t
}

export function consumePendingJump(file: ReviewFile | null): void {
	const t = pending
	if (!t) return
	pending = null
	jumpToThread(file, t)
}

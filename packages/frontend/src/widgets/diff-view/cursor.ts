import {
	currentChanges,
	fromDisplayLine,
	currentFileOrNull,
} from '@entities/review/changes'
import { acceptChange } from '@features/decide-change/decisions'
import { openCommentComposer } from '@features/manage-comment/selection'
import { mergeRows } from '@shared/diff-renderer/cursor-rows'
import { diffShadowRoot } from '@shared/lib/diff-dom'
import { $ } from '@shared/lib/dom'
import { notifyStateMutation } from '@shared/lib/reactive'
import { render } from '@shared/lib/render-scheduler'

import { diffCtx } from './context'
import { D } from './runtime'

import type { ChangeState, ReviewComment } from '@entities/review/model'
import type { Row } from '@shared/diff-renderer/cursor-rows'
import type { Side } from '@shared/diff-renderer/types'

// The cursor is a logical {side, line} (stable across re-renders, line numbers are), resolved to a rendered row on demand.
// The highlight is Pierre's own line selection (notify:false - paints without firing the selection callbacks, so no composer popup), so pointer and keyboard share ONE highlight.

let cur: { side: Side; line: number } | null = null

function lineSide(type: string, column: Element | null): Side {
	if (type.includes('deletion')) return 'deletions'
	if (type.includes('addition')) return 'additions'
	if (column?.hasAttribute('data-deletions')) return 'deletions'
	return 'additions'
}

function rows(): Row[] {
	const shadow = diffShadowRoot()
	if (!shadow) return []
	const diff = $('diff')
	const diffTop = diff.getBoundingClientRect().top
	const { scrollTop } = diff
	const out: Row[] = []
	shadow
		.querySelectorAll<HTMLElement>('[data-line-number-content]')
		.forEach(span => {
			const cell = span.closest<HTMLElement>('[data-line-type]')
			if (!cell) return
			const type = cell.getAttribute('data-line-type') ?? ''
			const column = span.closest<HTMLElement>(
				'[data-additions],[data-deletions]',
			)
			const line = parseInt(span.textContent, 10)
			if (!Number.isFinite(line)) return
			const rect = cell.getBoundingClientRect()
			if (!rect.height) return
			out.push({
				el: cell,
				side: lineSide(type, column),
				line,
				top: rect.top - diffTop + scrollTop,
				height: rect.height,
				change: type.startsWith('change-'),
			})
		})
	return mergeRows(out)
}

function matches(row: Row, side: Side, line: number): boolean {
	if (row.side === side && row.line === line) return true
	return !!row.alt && row.alt.side === side && row.alt.line === line
}

function indexOfCur(list: Row[]): number {
	const cursor = cur
	return cursor
		? list.findIndex(r => matches(r, cursor.side, cursor.line))
		: -1
}

function paint(r: Row): void {
	D.instance?.setSelectedLines(
		{ start: r.line, end: r.line, side: r.side },
		{ notify: false },
	)
}

function hide(): void {
	D.instance?.setSelectedLines(null, { notify: false })
}

function landOn(r: Row | undefined, shouldScroll = true): void {
	if (!r) return
	cur = { side: r.side, line: r.line }
	paint(r)
	if (!shouldScroll) return
	r.el?.scrollIntoView({ block: 'nearest' })
}

export function cursorSyncTo(side: Side, line: number): void {
	cur = { side, line }
}

export function cursorResync(): void {
	const cursor = cur
	if (!cursor) {
		hide()
		return
	}
	const r = rows().find(x => matches(x, cursor.side, cursor.line))
	if (r) paint(r)
	else hide()
}

export function cursorReset(): void {
	cur = null
	hide()
}

export function cursorSelection(): { side: Side; lineNumber: number } | null {
	if (!cur) return null
	return { side: cur.side, lineNumber: cur.line }
}

function ensureCursor(): Row | undefined {
	const cursor = cur
	if (cursor) return rows().find(x => matches(x, cursor.side, cursor.line))
	const list = rows()
	if (!list.length) return undefined
	const r = list.find(x => x.change) ?? list[0]
	landOn(r, false)
	return r
}

export function landAt(side: Side, line: number): boolean {
	const list = rows()
	const r =
		list.find(x => matches(x, side, line)) ??
		list.find(x => x.line === line)
	if (!r) return false
	cur = { side: r.side, line: r.line }
	paint(r)
	r.el?.scrollIntoView({ block: 'center' })
	return true
}

const JUMP_RETRY_FRAMES = 8

function landWithin(side: Side, line: number, framesLeft: number): void {
	if (!framesLeft) return
	requestAnimationFrame(() => {
		if (!landAt(side, line)) landWithin(side, line, framesLeft - 1)
	})
}

export function cursorJumpTo(side: Side, line: number): void {
	if (landAt(side, line)) return
	D.virtual?.scrollToLine({ side, line })
	landWithin(side, line, JUMP_RETRY_FRAMES)
}

export function cursorMoveLine(dir: 1 | -1): void {
	const list = rows()
	if (!list.length) return
	if (!cur) {
		ensureCursor()
		return
	}
	const i = indexOfCur(list)
	if (i < 0) {
		landOn(dir === 1 ? list[0] : list[list.length - 1])
		return
	}
	landOn(list[Math.max(0, Math.min(list.length - 1, i + dir))])
}

export function cursorMoveHunk(dir: 1 | -1): void {
	const list = rows()
	if (!list.length) return
	if (!cur) {
		ensureCursor()
		return
	}
	const isStart = (j: number): boolean => {
		const row = list[j]
		const before = list[j - 1]
		return !!row?.change && (j === 0 || !before?.change)
	}
	const i = indexOfCur(list)
	for (let j = i + dir; j >= 0 && j < list.length; j += dir) {
		if (isStart(j)) {
			landOn(list[j])
			return
		}
	}
	const far = D.virtual?.farChangeStart(cur, dir)
	if (far) {
		cursorJumpTo(far.side, far.line)
		return
	}
	diffCtx().toast(dir === 1 ? 'No more changes' : 'No previous changes')
}

function cursorChange(): ChangeState | null {
	const cursor = cur
	if (!cursor) return null
	return (
		currentChanges(
			diffCtx().S.state,
			currentFileOrNull(
				diffCtx().S.state?.files,
				diffCtx().S.preview,
				diffCtx().S.fileIndex,
			),
		).find(
			c =>
				c.side === cursor.side &&
				cursor.line >= (c.displayLineNumber ?? c.lineNumber) &&
				cursor.line <= (c.displayEndLine ?? c.endLine ?? c.lineNumber),
		) ?? null
	)
}

export function cursorComment(): void {
	if (!cur) ensureCursor()
	if (!cur) return
	diffCtx().S.selected = { side: cur.side, lineNumber: cur.line }
	openCommentComposer()
}

export function cursorVerdict(status: 'accepted' | 'rejected'): void {
	if (!cur) ensureCursor()
	const change = cursorChange()
	if (!change) {
		diffCtx().toast('No change under the cursor')
		return
	}
	void acceptChange(change.id, status)
}

function threadComments(): ReviewComment[] {
	const cursor = cur
	if (!cursor) return []
	const raw = fromDisplayLine(cursor.side, cursor.line, D.lineMap)
	return (diffCtx().S.state?.comments ?? []).filter(
		c =>
			c.path ===
				(diffCtx().S.preview?.path ??
					diffCtx().S.state?.files[diffCtx().S.fileIndex]?.path) &&
			c.side === cursor.side &&
			c.lineNumber === raw,
	)
}

export function cursorResolve(): void {
	const thread = threadComments()
	if (!thread.length) {
		diffCtx().toast('No comment on this line')
		return
	}
	const isOpen = thread.some(c => c.status === 'open')
	for (const c of thread) c.status = isOpen ? 'resolved' : 'open'
	notifyStateMutation()
	void render()
	diffCtx().persist()
	diffCtx().toast(isOpen ? 'Resolved' : 'Reopened')
}

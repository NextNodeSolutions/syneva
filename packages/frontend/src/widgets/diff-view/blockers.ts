import {
	currentFile,
	currentFileOrNull,
	groupLineComments,
	isFileComment,
	toDisplayLine,
} from '@entities/review/changes'
import { isUnanchored } from '@entities/review/changes'
import { cx } from '@shared/lib/cx'
import { tip } from '@shared/ui/tip.styles'
import { tag } from '@syneva/design-system/controls.styles'

import { blockers } from './blockers.styles'
import { jumpTargetFor, jumpToThread } from './comment-jump'
import { diffCtx } from './context'
import { cursorJumpTo } from './cursor'
import { D } from './runtime'

import type { Decision } from '@entities/review/model'
import type { FileDiffMetadata } from '@pierre/diffs'
import type { Side } from '@shared/diff-renderer/types'

type HunkPart = NonNullable<
	FileDiffMetadata['hunks'][number]['hunkContent']
>[number]

const PREVIEW_MAX = 64
const PREVIEW_HEAD = 63

export type Blocker =
	| { kind: 'reject'; decision: Decision }
	| {
			kind: 'thread'
			path: string
			side: Side
			lineNumber: number
			preview: string
			unanchored: boolean
			fileLevel: boolean
	  }

// Must mirror fileObjections (changes.ts) exactly - the chip count and the button label have to agree on what counts.
export function fileBlockers(path: string): Blocker[] {
	const state = diffCtx().requireState()
	const out: Blocker[] = []
	for (const d of state.decisions ?? [])
		if (d.path === path && d.status === 'rejected')
			out.push({ kind: 'reject', decision: d })
	const file = state.files.find(f => f.path === path)
	const groups = groupLineComments(
		state.comments.filter(
			c =>
				c.path === path &&
				c.status === 'open' &&
				c.role !== 'agent' &&
				c.intent !== 'question',
		),
	)
	for (const comments of groups.values()) {
		const [first] = comments
		if (!first) continue
		const preview = first.body.replace(/\s+/g, ' ').trim()
		out.push({
			kind: 'thread',
			path: first.path,
			side: first.side,
			lineNumber: first.lineNumber,
			preview:
				preview.length > PREVIEW_MAX
					? `${preview.slice(0, PREVIEW_HEAD)}…`
					: preview,
			unanchored: !!file && comments.some(c => isUnanchored(c, file)),
			fileLevel: isFileComment(first),
		})
	}
	return out
}

function partAt(hunkIndex: number, changeIndex: number): HunkPart | undefined {
	return D.fileDiff?.hunks.at(hunkIndex)?.hunkContent.at(changeIndex)
}

function decisionDisplayPos(d: Decision): { side: Side; line: number } {
	const ch = diffCtx()
		.requireState()
		.changes.find(c => c.id === d.key)
	const changeIndex = ch?.changeIndex
	const part =
		ch && typeof changeIndex === 'number'
			? partAt(ch.hunkIndex, changeIndex)
			: undefined
	if (!ch || !part)
		return {
			side: d.side,
			line: toDisplayLine(d.side, d.lineNumber, D.lineMap),
		}
	if (part.type === 'change')
		return {
			side: ch.side,
			line:
				(ch.side === 'additions'
					? part.additionLineIndex
					: part.deletionLineIndex) + 1,
		}
	return { side: 'additions', line: part.additionLineIndex + 1 }
}

export function jumpToBlocker(b: Blocker): void {
	if (b.kind === 'thread') {
		jumpToThread(
			currentFileOrNull(
				diffCtx().S.state?.files,
				diffCtx().S.preview,
				diffCtx().S.fileIndex,
			),
			jumpTargetFor(b),
		)
		return
	}
	const pos = decisionDisplayPos(b.decision)
	cursorJumpTo(pos.side, pos.line)
}

const ROW_WHERE = cx(blockers.where)
const ROW_TEXT = `<span class="${cx(blockers.text)}" data-part="text"></span>`

function blockerRowBody(b: Blocker): { html: string; text: string } {
	if (b.kind === 'reject')
		return {
			html: `<span class="${cx(tag.base, tag.red, blockers.kind)}">Rejected</span><span class="${ROW_WHERE}">line ${b.decision.lineNumber}</span>${ROW_TEXT}`,
			text: b.decision.title,
		}
	let where = `line ${b.lineNumber}`
	if (b.fileLevel) where = 'file'
	else if (b.unanchored) where = 'unanchored'
	return {
		html: `<span class="${cx(tag.base, tag.amber, blockers.kind)}">Change request</span><span class="${ROW_WHERE}">${where}</span>${ROW_TEXT}`,
		text: b.preview,
	}
}

function blockerRow(b: Blocker, close: () => void): HTMLElement {
	const row = document.createElement('button')
	row.className = cx(blockers.item)
	const { html, text } = blockerRowBody(b)
	row.innerHTML = html
	const textNode = row.querySelector('[data-part="text"]')
	if (textNode) textNode.textContent = text
	row.addEventListener('click', () => {
		close()
		jumpToBlocker(b)
	})
	return row
}

export function blockersChip(): HTMLElement | null {
	const { path } = currentFile(
		diffCtx().S.state?.files,
		diffCtx().S.preview,
		diffCtx().S.fileIndex,
	)
	const items = fileBlockers(path)
	if (!items.length) return null
	const wrap = document.createElement('span')
	wrap.className = cx(blockers.wrap)
	const btn = document.createElement('button')
	btn.textContent = `${items.length} blocker${items.length === 1 ? '' : 's'}`
	btn.setAttribute('data-tip', "What's keeping this file from Approved")
	wrap.appendChild(btn)
	const pop = document.createElement('div')
	const setOpen = (isOpen: boolean): void => {
		wrap.toggleAttribute('data-open', isOpen)
		btn.className = cx(
			blockers.trigger,
			tip.host,
			tip.end,
			isOpen && blockers.triggerOpen,
		)
		pop.className = cx(blockers.pop, isOpen && blockers.popOpen)
	}
	setOpen(false)
	for (const b of items) pop.appendChild(blockerRow(b, () => setOpen(false)))
	wrap.appendChild(pop)
	btn.addEventListener('click', e => {
		e.stopPropagation()
		const open = !wrap.hasAttribute('data-open')
		setOpen(open)
		if (!open) return
		const close = (ev: MouseEvent): void => {
			if (ev.target instanceof Node && wrap.contains(ev.target)) return
			setOpen(false)
			document.removeEventListener('click', close, true)
		}
		document.addEventListener('click', close, true)
	})
	return wrap
}

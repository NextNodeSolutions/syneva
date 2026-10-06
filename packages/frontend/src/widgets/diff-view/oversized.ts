import {
	currentFile,
	currentFileOrNull,
	fileFinished,
	fileObjections,
	fileReviewState,
} from '@entities/review/changes'
import { movedFrom } from '@entities/review/file/renames'
import {
	currentGuideEntry,
	guideInputs,
	hasGuide,
} from '@entities/review/guide/guide'
import {
	approveCurrentFile,
	resetReview,
	rejectFile,
} from '@features/decide-change/decisions'
import { cx } from '@shared/lib/cx'
import { $ } from '@shared/lib/dom'
import { esc } from '@shared/lib/esc'
import { deskControl } from '@shared/ui/desk-control.styles'
import { iconHtml } from '@shared/ui/icon-html'
import { icon } from '@shared/ui/icon.styles'
import { kbdHtml } from '@shared/ui/kbd-html'
import { caption, control, tag } from '@syneva/design-system/controls.styles'
import { kbd } from '@syneva/design-system/inline.styles'
import { press } from '@syneva/design-system/press.styles'

import { churnCounts } from './change-kind'
import { changeTone } from './change-kind.styles'
import {
	fileCommentIconButton,
	fileCommentSection,
	fileCommentsEnabled,
} from './comment-thread/file-comments'
import { diffCtx } from './context'
import { oversized } from './oversized.styles'

import type { ReviewState } from '@entities/review/model'
import type { StaticStyle } from '@shared/lib/cx'

type ReviewFile = ReviewState['files'][number]
type GuideEntry = ReturnType<typeof currentGuideEntry>

const BYTES_PER_UNIT = 1024

export function isOversizedPlaceholder(
	f: ReviewFile = currentFile(
		diffCtx().S.state?.files,
		diffCtx().S.preview,
		diffCtx().S.fileIndex,
	),
): boolean {
	return !!f.oversized && !diffCtx().S.loadedOversized.has(f.path)
}

export function loadOversizedDiff(): void {
	const file = currentFileOrNull(
		diffCtx().S.state?.files,
		diffCtx().S.preview,
		diffCtx().S.fileIndex,
	)
	if (!file) return
	diffCtx().S.loadedOversized.add(file.path)
	diffCtx().deferRender()
}

function formatBytes(n: number): string {
	if (n < BYTES_PER_UNIT) return `${n} B`
	const units = ['KB', 'MB', 'GB']
	let v = n / BYTES_PER_UNIT
	let i = 0
	while (v >= BYTES_PER_UNIT && i < units.length - 1) {
		v /= BYTES_PER_UNIT
		i++
	}
	return `${i === 0 ? Math.round(v) : v.toFixed(1)} ${units[i]}`
}

function kindTone(kind: ReviewFile['changeKind']): StaticStyle {
	if (kind === 'added') return changeTone.added
	if (kind === 'deleted') return changeTone.deleted
	if (kind === 'renamed') return changeTone.renamed
	return changeTone.modified
}

// Identical semantics to a rendered file's header: finished → state tag + Reset; otherwise Reject file (when there are blocks) + Approve / Mark reviewed.
function finishedControls(wrap: HTMLElement, path: string): HTMLElement {
	const state = fileReviewState(diffCtx().S.state, path)
	const pill = document.createElement('span')
	pill.className = cx(tag.base, state === 'approved' ? tag.green : tag.amber)
	pill.textContent = state === 'approved' ? 'Approved' : 'Changes requested'
	wrap.appendChild(pill)
	const reset = document.createElement('button')
	reset.className = cx(
		press.control,
		control.base,
		control.quiet,
		deskControl.compact,
	)
	reset.textContent = 'Reset'
	reset.addEventListener('click', () => void resetReview(path))
	wrap.appendChild(reset)
	return wrap
}

function verdictControls(path: string): HTMLElement {
	const wrap = document.createElement('div')
	wrap.className = cx(oversized.verdict)
	if (fileFinished(diffCtx().S.state, path))
		return finishedControls(wrap, path)
	const hasBlocks = (diffCtx().S.state?.changes ?? []).some(
		c => c.path === path,
	)
	if (hasBlocks) {
		const reject = document.createElement('button')
		reject.className = cx(
			press.control,
			control.base,
			deskControl.dangerHintTiled,
			deskControl.compact,
		)
		reject.textContent = 'Reject file'
		reject.addEventListener('click', () => void rejectFile(path))
		wrap.appendChild(reject)
	}
	const objections = fileObjections(diffCtx().S.state, path)
	const approve = document.createElement('button')
	approve.className = cx(
		press.control,
		control.base,
		objections ? deskControl.caution : deskControl.keep,
		deskControl.compact,
	)
	approve.innerHTML = objections
		? `Mark reviewed${kbdHtml('⇧A', kbd.onTint)}`
		: `Approve${kbdHtml('⇧A', kbd.onFill)}`
	approve.addEventListener('click', () => void approveCurrentFile())
	wrap.appendChild(approve)
	return wrap
}

function headSection(file: ReviewFile): HTMLElement {
	const head = document.createElement('div')
	const tone = kindTone(file.changeKind)
	head.className = cx(oversized.head)
	head.innerHTML = iconHtml('gly-file', icon.large, tone)
	const name = document.createElement('span')
	name.className = cx(oversized.path)
	name.textContent = file.path
	head.appendChild(name)
	const from = movedFrom(diffCtx().S.state?.files ?? [], file.path)
	if (from) {
		const moved = document.createElement('span')
		moved.className = cx(oversized.moved)
		moved.innerHTML = `${iconHtml('gly-arrow-right', icon.tiny)}<span>from ${esc(from)}</span>`
		head.appendChild(moved)
	}
	const kind = document.createElement('span')
	kind.className = cx(caption.base, caption.upper, tone, oversized.kind)
	kind.textContent = file.changeKind ?? 'modified'
	head.appendChild(kind)
	if (!hasGuide(guideInputs(diffCtx().S)) && fileCommentsEnabled())
		head.appendChild(fileCommentIconButton('card'))
	return head
}

function badgesSection(entry: GuideEntry): HTMLElement | null {
	if (!entry) return null
	const badges = document.createElement('div')
	badges.className = cx(oversized.badges)
	const cat = document.createElement('span')
	cat.className = cx(caption.base, caption.upper, oversized.category)
	cat.textContent = entry.category
	badges.appendChild(cat)
	return badges
}

function statsSection(file: ReviewFile): HTMLElement {
	const stats = document.createElement('div')
	stats.className = cx(oversized.stats)
	if (typeof file.size === 'number') {
		const size = document.createElement('span')
		size.className = cx(oversized.size)
		size.textContent = formatBytes(file.size)
		stats.appendChild(size)
	}
	stats.appendChild(churnCounts(file.added, file.removed, oversized.counts))
	return stats
}

function actionsSection(path: string): HTMLElement {
	const actions = document.createElement('div')
	actions.className = cx(oversized.actions)
	actions.appendChild(verdictControls(path))
	const load = document.createElement('button')
	load.className = cx(
		press.control,
		control.base,
		control.outlined,
		deskControl.compact,
		oversized.load,
	)
	load.innerHTML = `Load diff anyway${kbdHtml('↵')}`
	load.addEventListener('click', () => loadOversizedDiff())
	actions.appendChild(load)
	return actions
}

export function renderOversizedCard(): void {
	const file = currentFile(
		diffCtx().S.state?.files,
		diffCtx().S.preview,
		diffCtx().S.fileIndex,
	)
	const entry = currentGuideEntry(guideInputs(diffCtx().S))
	const card = document.createElement('div')
	card.className = cx(oversized.card)
	card.appendChild(headSection(file))
	const badges = badgesSection(entry)
	if (badges) card.appendChild(badges)
	card.appendChild(statsSection(file))
	const note = document.createElement('p')
	note.className = cx(oversized.note)
	note.textContent =
		'This file is large. Its diff is hidden to keep the desk responsive.'
	card.appendChild(note)
	const fc = fileCommentSection('card')
	if (fc) card.appendChild(fc)
	card.appendChild(actionsSection(file.path))
	$('diff').replaceChildren(card)
}

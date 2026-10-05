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
import { kbd } from '@shared/ui/kbd.styles'
import { caption, control, tag } from '@syneva/design-system/controls.styles'
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

// ── Oversized-file placeholder card (issue 05) ───────────────────────────────
// A file whose diff would freeze the tab (server-stamped `oversized`, see state.ts) renders as a
// verdict-capable summary card INSTEAD of fetching + rendering its diff - so opening it never
// blocks on a multi-MB tokenization pass. The card carries the file's stats, its guide badges, the
// same whole-file verdict controls a rendered file has, and a "Load diff anyway" escape hatch. Once
// loaded, the file behaves like any rendered file for the rest of the session (diffCtx().S.loadedOversized).

// Whether `f` (default: the current file) should paint the placeholder card right now: it's stamped
// oversized and the reviewer hasn't chosen to load its real diff this session.
export function isOversizedPlaceholder(
	f: ReviewFile = currentFile(
		diffCtx().S.state?.files,
		diffCtx().S.preview,
		diffCtx().S.fileIndex,
	),
): boolean {
	return !!f.oversized && !diffCtx().S.loadedOversized.has(f.path)
}

// "Load diff anyway": remember the choice and render the file normally.
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

// Human-readable byte size (the card's focal stat - the file is large). Binary units, one decimal
// past KB so a 1.4 MB file doesn't round to "1 MB".
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

// Change-kind → the tone the diff header's icon speaks in (change-kind.styles.ts).
function kindTone(kind: ReviewFile['changeKind']): StaticStyle {
	if (kind === 'added') return changeTone.added
	if (kind === 'deleted') return changeTone.deleted
	if (kind === 'renamed') return changeTone.renamed
	return changeTone.modified
}

// A finished file's verdict: its state as a tag, and a quiet Reset to undo the sign-off.
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

// The whole-file verdict controls - identical semantics to a rendered file's header:
// finished → a state tag + Reset; otherwise Reject file (when there are blocks to reject) +
// Approve / Mark reviewed.
function verdictControls(path: string): HTMLElement {
	const wrap = document.createElement('div')
	wrap.className = cx(oversized.verdict)
	if (fileFinished(diffCtx().S.state, path))
		return finishedControls(wrap, path)
	// Reject file only makes sense when the file actually has change blocks (a hunk-less added file
	// has none - nothing to reject block-by-block).
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

// Row 1: change-type icon + path (+ rename arrow) + a kind badge (+ the whole-file comment
// trigger on unguided desks - the guide bar owns it otherwise).
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
	// The whole-file comment trigger, UNGUIDED desks only (a guided desk's icon is in the guide
	// bar next to home; and the two surfaces must never show duplicates).
	// Whole-file comment trigger: multi-file unguided desks only (a guided desk's icon is in
	// the guide bar; a single-file desk has no use for the scope).
	if (!hasGuide(guideInputs(diffCtx().S)) && fileCommentsEnabled())
		head.appendChild(fileCommentIconButton('card'))
	return head
}

// The section this file is grouped under, as a chip on the card (the diff header shows the same one).
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

// Stats: byte size is the focal number (why this is a card), with the churn counts beside it.
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

// Render the summary card into #diff. Called from renderCenter in place of the diff, BEFORE any
// contents fetch - so an oversized file costs nothing to open.
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
	// The oversized card is the file's whole verdict surface - a whole-file comment naturally
	// lives here too (its thread renders inside the card like any file header section, set off
	// from the note by the card placement's margin).
	const fc = fileCommentSection('card')
	if (fc) card.appendChild(fc)
	card.appendChild(actionsSection(file.path))
	$('diff').replaceChildren(card)
}

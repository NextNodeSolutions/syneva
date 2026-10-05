import { currentFile } from '@entities/review/changes'
import { fileFinished, fileObjections } from '@entities/review/changes'
import { currentSplittable } from '@entities/review/file/contents'
import { movedFrom } from '@entities/review/file/renames'
import {
	currentGuideEntry,
	guideInputs,
	hasGuide,
} from '@entities/review/guide/guide'
import {
	approveCurrentFile,
	resetReview,
} from '@features/decide-change/decisions'
import { cx } from '@shared/lib/cx'
import { deskControl, segmented } from '@shared/ui/desk-control.styles'
import { iconHtml } from '@shared/ui/icon-html'
import { kbdHtml } from '@shared/ui/kbd-html'
import { kbd } from '@shared/ui/kbd.styles'
import { tip } from '@shared/ui/tip.styles'
import { caption, control } from '@syneva/design-system/controls.styles'
import { press } from '@syneva/design-system/press.styles'

import { blockersChip } from './blockers'
import { changeIcon, churnCounts } from './change-kind'
import {
	fileCommentIconButton,
	fileCommentSection,
	fileCommentsEnabled,
} from './comment-thread/file-comments'
import { unanchoredStrip } from './comment-thread/strip'
import { diffCtx } from './context'
import { diffHeader } from './file-header.styles'

import type { FileDiffMetadata } from '@pierre/diffs'

// The custom diff header (all changed-file modes). Row 1 keeps @pierre's change-type icon beside
// the filename, then the Split/Stacked register, the file actions, the counts and the sign-off.
// With a guide, a ruled label under it (left-aligned) names the file's section. A preview (an
// unchanged file the reviewer opened to read) gets a minimal read-only header instead.

// The Split / Stacked register in the diff header (right of the filename), a step smaller than
// the chrome's so it doesn't compete with the filename; clicking re-renders the diff, which
// rebuilds this control with the new current choice.
function layoutToggle(): HTMLElement {
	const wrap = document.createElement('span')
	wrap.className = cx(segmented.group, tip.host)
	wrap.setAttribute('data-tip', 'Split / Stacked (v)')
	const mk = (label: string, style: 'split' | 'unified'): void => {
		const b = document.createElement('button')
		b.textContent = label
		b.className = cx(
			segmented.item,
			segmented.itemSmall,
			diffCtx().S.diffStyle === style && segmented.on,
		)
		b.addEventListener('click', () => diffCtx().S.setStyle?.(style))
		wrap.appendChild(b)
	}
	mk('Split', 'split')
	mk('Stacked', 'unified')
	return wrap
}

// Icon-only "jump to this file in the local editor" button - file-scoped, so it lives in
// the file header rather than the app chrome (the top bar is for review-final actions).
function openEditorButton(): HTMLElement {
	const b = document.createElement('button')
	b.className = cx(
		press.control,
		control.base,
		control.quiet,
		deskControl.mini,
		deskControl.iconMini,
		tip.host,
	)
	b.setAttribute('data-tip', 'Open in editor (⇧E)')
	b.innerHTML = iconHtml('gly-open-editor', diffHeader.editorIcon)
	b.addEventListener('click', () => void diffCtx().S.openInEditor?.())
	return b
}

// The whole-file comment trigger, only where a file-level scope adds something over the line
// threads: hidden on guided desks (the guide bar owns it) and on single-file desks (every
// comment already addresses the one file). Explicit-route fallback for unguided multi-file desks.
export function fileCommentButton(): HTMLElement | null {
	if (hasGuide(guideInputs(diffCtx().S)) || !fileCommentsEnabled())
		return null
	return fileCommentIconButton('header')
}

// The per-file sign-off action in the diff header. Unfinished -> one context button:
// "Approve" (clean) or "Mark reviewed" (has a rejected hunk / open requested-change), which
// accepts pending hunks, signs off, and advances. Finished -> Reset to undo the sign-off.
export function headerActions(): HTMLElement {
	const wrap = document.createElement('span')
	const filePath = currentFile(
		diffCtx().S.state?.files,
		diffCtx().S.preview,
		diffCtx().S.fileIndex,
	).path
	const reset = (): HTMLElement => {
		const b = document.createElement('button')
		b.className = cx(
			press.control,
			control.base,
			deskControl.mini,
			diffHeader.undo,
		)
		b.textContent = 'Reset'
		b.addEventListener('click', () => void resetReview(filePath))
		return b
	}
	// The chip lists what keeps the file from Approved (rejected hunks, open change
	// requests) with jump-to actions - rendered whenever objections exist, finished or not.
	const chip = blockersChip()
	if (fileFinished(diffCtx().S.state, filePath)) {
		// The file-tree badge carries the approved / changes-requested state; the header just
		// offers a quiet Reset to undo the sign-off (plus the blockers chip when relevant).
		if (chip) wrap.appendChild(chip)
		wrap.appendChild(reset())
	} else {
		const objections = fileObjections(diffCtx().S.state, filePath)
		// Reset (clear in-progress hunk decisions) sits on the left; Approve is always far right.
		if (diffCtx().S.state?.decisionFiles?.includes(filePath))
			wrap.appendChild(reset())
		if (chip) wrap.appendChild(chip)
		const button = document.createElement('button')
		button.className = cx(
			press.control,
			control.base,
			deskControl.mini,
			objections ? deskControl.caution : deskControl.keep,
		)
		button.innerHTML = objections
			? `Mark reviewed${kbdHtml('⇧A', kbd.onTint)}`
			: `Approve${kbdHtml('⇧A', kbd.onFill)}`
		button.addEventListener('click', () => void approveCurrentFile())
		wrap.appendChild(button)
	}
	return wrap
}

// The file's +/- counts over all hunks, rendered as the +/- spans pair.
function diffCounts(file: FileDiffMetadata): HTMLElement {
	let added = 0
	let deleted = 0
	for (const hunk of file.hunks) {
		added += hunk.additionLines
		deleted += hunk.deletionLines
	}
	return churnCounts(added, deleted, diffHeader.counts)
}

// Row 1 of a changed file's header: icon, path, rename note, layout toggle, editor button, the
// +/- counts and the file's actions.
function headerRow(file: FileDiffMetadata): HTMLElement {
	const row = document.createElement('div')
	row.className = cx(diffHeader.row)
	row.appendChild(changeIcon(file.type))
	const filePath = currentFile(
		diffCtx().S.state?.files,
		diffCtx().S.preview,
		diffCtx().S.fileIndex,
	).path
	const name = document.createElement('span')
	name.className = cx(diffHeader.path)
	name.textContent = filePath
	row.appendChild(name)
	// Rename+edit files (git -M): note where the file moved from, right of the new path.
	const from = movedFrom(diffCtx().S.state?.files ?? [], filePath)
	if (from) {
		const moved = document.createElement('span')
		moved.className = cx(diffHeader.moved)
		moved.title = `moved from ${from}`
		moved.textContent = `moved from ${from}`
		row.appendChild(moved)
	}
	// Layout toggle right of the filename - only when Split actually applies (a two-sided diff).
	if (
		currentSplittable(
			diffCtx().S.preview ??
				diffCtx().S.state?.files[diffCtx().S.fileIndex],
		)
	)
		row.appendChild(layoutToggle())
	const fc = fileCommentButton()
	if (fc) row.appendChild(fc)
	row.appendChild(openEditorButton())
	const grow = document.createElement('span')
	grow.className = cx(diffHeader.grow)
	row.appendChild(grow)
	row.appendChild(diffCounts(file))
	const actions = headerActions()
	actions.className = cx(diffHeader.actions)
	row.appendChild(actions)
	return row
}

// Row 2, when a grouping is attached: the section this file is listed under. It restates the
// Walkthrough heading beside the file itself, so the reviewer never has to look sideways to know
// which domain they're in.
function guideRow(): HTMLElement | null {
	const entry = currentGuideEntry(guideInputs(diffCtx().S))
	if (!entry) return null
	const guide = document.createElement('div')
	guide.className = cx(diffHeader.guide)
	const chip = document.createElement('span')
	chip.className = cx(caption.base, caption.upper, diffHeader.category)
	chip.textContent = entry.category
	guide.appendChild(chip)
	return guide
}

function fileHeader(file: FileDiffMetadata): HTMLElement {
	const wrap = document.createElement('div')
	wrap.className = cx(diffHeader.header)
	wrap.appendChild(headerRow(file))
	const guide = guideRow()
	if (guide) wrap.appendChild(guide)
	// Whole-file comments sit above the unanchored strip: a file-header thread reads before the
	// "these lost their line" warning strip underneath it.
	const fc = fileCommentSection()
	if (fc) wrap.appendChild(fc)
	const strip = unanchoredStrip()
	if (strip) wrap.appendChild(strip)
	return wrap
}

// Preview gets its own minimal header: a neutral file icon + path + a read-only tag - no +/- counts,
// change-type icon, or guidance (all of which would mislabel an unchanged file rendered as
// one-sided content). The Approve / Reset actions don't apply to a preview, but a whole-file
// comment does (the same rule the unguided changed-file header follows).
function previewHeader(): HTMLElement {
	const wrap = document.createElement('div')
	wrap.className = cx(diffHeader.header)
	const row = document.createElement('div')
	row.className = cx(diffHeader.row)
	row.appendChild(changeIcon('file'))
	const name = document.createElement('span')
	name.className = cx(diffHeader.path)
	name.textContent = currentFile(
		diffCtx().S.state?.files,
		diffCtx().S.preview,
		diffCtx().S.fileIndex,
	).path
	row.appendChild(name)
	const fc = fileCommentButton()
	if (fc) row.appendChild(fc)
	row.appendChild(openEditorButton())
	const grow = document.createElement('span')
	grow.className = cx(diffHeader.grow)
	row.appendChild(grow)
	const tag = document.createElement('span')
	tag.className = cx(caption.base, diffHeader.readonly)
	tag.textContent = 'Unchanged'
	row.appendChild(tag)
	wrap.appendChild(row)
	const section = fileCommentSection()
	if (section) wrap.appendChild(section)
	return wrap
}

// The header's host: Pierre slots it whenever it rebuilds its own header (a new diff, new
// options), and every render pass refills it from the live store - approval, blockers and file
// comments change without the diff changing, and must not cost Pierre a row rebuild.
// `display: contents` keeps the host out of the slot's layout.
const headerHost = document.createElement('div')
headerHost.style.display = 'contents'

export function slotDiffHeader(): HTMLElement {
	return headerHost
}

export function refreshDiffHeader(
	file: FileDiffMetadata,
	isPreviewing: boolean,
): void {
	headerHost.replaceChildren(
		isPreviewing ? previewHeader() : fileHeader(file),
	)
}

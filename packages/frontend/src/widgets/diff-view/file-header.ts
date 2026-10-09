import { currentFile } from '@entities/review/changes'
import { fileFinished, fileObjections } from '@entities/review/changes'
import { currentSplittable } from '@entities/review/file/contents'
import { movedFrom } from '@entities/review/file/renames'
import {
	approveCurrentFile,
	resetReview,
} from '@features/decide-change/decisions'
import { cx } from '@shared/lib/cx'
import { deskControl, segmented } from '@shared/ui/desk-control.styles'
import { iconHtml } from '@shared/ui/icon-html'
import { kbdHtml } from '@shared/ui/kbd-html'
import { tip } from '@shared/ui/tip.styles'
import { caption, control } from '@syneva/design-system/controls.styles'
import { kbd } from '@syneva/design-system/inline.styles'
import { press } from '@syneva/design-system/press.styles'

import { blockersChip } from './blockers'
import { changeIcon, churnCounts } from './change-kind'
import {
	fileCommentButton,
	fileCommentSection,
} from './comment-thread/file-comments'
import { unanchoredStrip } from './comment-thread/strip'
import { diffCtx } from './context'
import { diffHeader } from './file-header.styles'
import { currentDomainRows } from './guide-domain-chips'

import type { FileDiffMetadata } from '@pierre/diffs'

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
	const chip = blockersChip()
	if (fileFinished(diffCtx().S.state, filePath)) {
		if (chip) wrap.appendChild(chip)
		wrap.appendChild(reset())
	} else {
		const objections = fileObjections(diffCtx().S.state, filePath)
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

function diffCounts(file: FileDiffMetadata): HTMLElement {
	let added = 0
	let deleted = 0
	for (const hunk of file.hunks) {
		added += hunk.additionLines
		deleted += hunk.deletionLines
	}
	return churnCounts(added, deleted, diffHeader.counts)
}

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
	const from = movedFrom(diffCtx().S.state?.files ?? [], filePath)
	if (from) {
		const moved = document.createElement('span')
		moved.className = cx(diffHeader.moved)
		moved.title = `moved from ${from}`
		moved.textContent = `moved from ${from}`
		row.appendChild(moved)
	}
	if (
		currentSplittable(
			diffCtx().S.preview ??
				diffCtx().S.state?.files[diffCtx().S.fileIndex],
		)
	)
		row.appendChild(layoutToggle())
	const fc = fileCommentButton('header')
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

function fileHeader(file: FileDiffMetadata): HTMLElement {
	const wrap = document.createElement('div')
	wrap.className = cx(diffHeader.header)
	wrap.appendChild(headerRow(file))
	const guide = currentDomainRows(diffHeader.guide)
	if (guide) wrap.appendChild(guide)
	const fc = fileCommentSection()
	if (fc) wrap.appendChild(fc)
	const strip = unanchoredStrip()
	if (strip) wrap.appendChild(strip)
	return wrap
}

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
	const fc = fileCommentButton('header')
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

// The host is refilled on every render pass from the live store: approval, blockers and file comments change without the diff changing, and must not cost Pierre a row rebuild; display:contents keeps the host out of the slot's layout.
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

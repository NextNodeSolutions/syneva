import {
	currentFile,
	fileFinished,
	fileObjections,
} from '@entities/review/changes'
import {
	approveCurrentFile,
	resetReview,
} from '@features/decide-change/decisions'
import { cx } from '@shared/lib/cx'
import { deskControl } from '@shared/ui/desk-control.styles'
import { kbdHtml } from '@shared/ui/kbd-html'
import { control } from '@syneva/design-system/controls.styles'
import { kbd } from '@syneva/design-system/inline.styles'
import { press } from '@syneva/design-system/press.styles'

import { blockersChip } from './blockers'
import { diffCtx } from './context'
import { diffHeader } from './file-header.styles'

// The name bar's verdict on the file (file-header.ts): its blockers, Reset once it holds decisions, and Approve (or Mark reviewed over open objections) until it is finished.
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

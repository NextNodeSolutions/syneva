import { cx } from '@shared/lib/cx'
import { $ } from '@shared/lib/dom'
import { esc } from '@shared/lib/esc'
import { iconHtml } from '@shared/ui/icon-html'

import { fileNote } from './file-note.styles'

import type { ReviewFile } from '@entities/review/model'

export function renderMovedPure(file: ReviewFile, from: string): void {
	const name = cx(fileNote.name)
	$('diff').innerHTML =
		`<div class="${cx(fileNote.wrap)}"><div class="${cx(fileNote.strip)}">
    ${iconHtml('gly-arrow-right', fileNote.icon)}
    <span>renamed <span class="${name}">${esc(from)}</span> → <span class="${name}">${esc(file.path)}</span></span>
    <span class="${cx(fileNote.meta)}">no changes</span>
  </div></div>`
}

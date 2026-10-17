import { BRICK_KIND_LABELS, spanLabel } from '@entities/review/guide/bricks'
import { cx } from '@shared/lib/cx'
import { deskControl } from '@shared/ui/desk-control.styles'
import { kbdHtml } from '@shared/ui/kbd-html'
import { tip } from '@shared/ui/tip.styles'
import { control } from '@syneva/design-system/controls.styles'
import { press } from '@syneva/design-system/press.styles'

import { brickCard as card } from './brick-card.styles'
import { diffCtx } from './context'

import type { Brick } from '@entities/review/guide/bricks'
import type { LineRange } from '@entities/review/model'
import type { StaticStyle } from '@shared/lib/cx'

// The brick view's card (L3), in the name bar's place while the code is cut to a brick: what the brick is, where it stands before and after, how far its blocks are decided, and the way back to the whole file.

const EN_DASH = '\u2013'
const ARROW = '\u2192'

function part(text: string, ...styles: StaticStyle[]): HTMLElement {
	const el = document.createElement('span')
	el.className = cx(...styles)
	el.textContent = text
	return el
}

function linesLabel(range: LineRange): string {
	return range.startLine === range.endLine
		? `L${range.startLine}`
		: `L${range.startLine}${EN_DASH}${range.endLine}`
}

// A side the declaration is missing from reads as what happened to it there; a brick with no declaration (imports, comments, an un-outlined block) is placed by its blocks' spans.
function sides(brick: Brick): HTMLElement {
	const el = part('', card.lines)
	const { symbol } = brick
	if (!symbol) {
		el.textContent = brick.changes.map(spanLabel).join(' ')
		return el
	}
	el.append(
		part('before ', card.side),
		symbol.before ? linesLabel(symbol.before) : 'new',
		part(` ${ARROW} after `, card.side),
		symbol.after ? linesLabel(symbol.after) : 'removed',
	)
	return el
}

function tally(brick: Brick): HTMLElement {
	const decided = brick.changes.filter(change => change.status !== 'pending')
	const el = part('', card.tally)
	el.append(
		part(`${decided.length}/${brick.changes.length}`, card.count),
		' decided',
	)
	return el
}

function wholeFileButton(): HTMLElement {
	const b = document.createElement('button')
	b.className = cx(
		press.control,
		control.base,
		control.quiet,
		deskControl.mini,
		tip.host,
		tip.end,
		card.whole,
	)
	b.setAttribute('data-tip', 'Back to the whole file (f)')
	b.innerHTML = `Whole file${kbdHtml('Esc')}`
	b.addEventListener('click', () => diffCtx().S.toggleBrickFocus?.())
	return b
}

export function brickCard(
	brick: Brick,
	layout: HTMLElement | null,
): HTMLElement {
	const row = document.createElement('div')
	row.className = cx(card.row)
	row.setAttribute('data-brick-card', brick.key)
	const kind = BRICK_KIND_LABELS[brick.kind]
	if (kind) row.appendChild(part(kind, card.kind))
	row.append(
		part(brick.name, card.name),
		sides(brick),
		part(brick.path, card.path),
		part('', card.grow),
		tally(brick),
	)
	if (layout) row.appendChild(layout)
	row.appendChild(wholeFileButton())
	return row
}

import {
	currentChanges,
	currentFileOrNull,
	fromDisplayLine,
	toDisplayLine,
} from '@entities/review/changes'
import { diffShadowRoot } from '@shared/lib/diff-dom'

import { diffCtx } from './context'
import { D } from './runtime'

import type { ChangeSymbol, LineRange } from '@entities/review/model'
import type { Side } from '@shared/diff-renderer/types'

// The brick the cursor is in, drawn on the code: a rule down the gutter along the declaration's lines, on each side of the diff where that side holds it, so the reviewer sees how far the brick runs - its old extent on the left, its new one on the right - while the strip names it. A context line inside the declaration counts: the brick is the declaration, not its changed blocks.

const STYLE_MARK = 'data-brick-mark'

function rangeOn(symbol: ChangeSymbol, side: Side): LineRange | undefined {
	return side === 'deletions' ? symbol.before : symbol.after
}

function holds(range: LineRange | undefined, line: number): boolean {
	return !!range && line >= range.startLine && line <= range.endLine
}

// The narrowest brick of the shown file whose lines on this side hold the raw line: a method before its class.
function brickHolding(side: Side, line: number): ChangeSymbol | undefined {
	const { S } = diffCtx()
	const file = currentFileOrNull(S.state?.files, S.preview, S.fileIndex)
	if (!file || S.preview) return undefined
	const bricks = currentChanges(S.state, file)
		.map(change => change.symbol)
		.filter(
			(symbol): symbol is ChangeSymbol =>
				!!symbol && holds(rangeOn(symbol, side), line),
		)
	return bricks.toSorted((a, b) => {
		const spanA = rangeOn(a, side)
		const spanB = rangeOn(b, side)
		return (
			(spanA ? spanA.endLine - spanA.startLine : 0) -
			(spanB ? spanB.endLine - spanB.startLine : 0)
		)
	})[0]
}

// The displayed numbers of a raw range on one side: Pierre renumbers per render, the map says how.
function displayedLines(range: LineRange, side: Side): number[] {
	const start = toDisplayLine(side, range.startLine, D.lineMap)
	const end = toDisplayLine(side, range.endLine, D.lineMap)
	const lines: number[] = []
	for (let line = start; line <= end; line++) lines.push(line)
	return lines
}

function cells(column: string, lines: number[]): string {
	return lines
		.map(
			line =>
				`code${column} [data-gutter] > [data-column-number="${line}"]`,
		)
		.join(',')
}

// Split view numbers each column by its own side; the stacked view numbers removed rows by the old side and every other row by the new one.
function rulesFor(symbol: ChangeSymbol): string {
	const before = symbol.before
		? displayedLines(symbol.before, 'deletions')
		: []
	const after = symbol.after ? displayedLines(symbol.after, 'additions') : []
	const selectors = [
		before.length && cells('[data-deletions]', before),
		after.length && cells('[data-additions]', after),
		before.length &&
			cells('[data-unified] [data-line-type="change-deletion"]', before),
		after.length &&
			cells(
				'[data-unified] :not([data-line-type="change-deletion"])',
				after,
			),
	].filter(Boolean)
	if (!selectors.length) return ''
	return `${selectors.join(',')}{box-shadow:inset 3px 0 0 var(--accent)}`
}

function styleSheet(): HTMLStyleElement | null {
	const shadow = diffShadowRoot()
	if (!shadow) return null
	const existing = shadow.querySelector(`style[${STYLE_MARK}]`)
	if (existing instanceof HTMLStyleElement) return existing
	const style = document.createElement('style')
	style.setAttribute(STYLE_MARK, '')
	shadow.append(style)
	return style
}

// Marks the brick under the cursor's displayed row, or clears the mark; called on every cursor paint, so the rule follows the cursor and survives a re-render.
export function markBrickAt(at: { side: Side; line: number } | null): void {
	const style = styleSheet()
	if (!style) return
	const symbol = at
		? brickHolding(at.side, fromDisplayLine(at.side, at.line, D.lineMap))
		: undefined
	const rules = symbol ? rulesFor(symbol) : ''
	if (style.textContent !== rules) style.textContent = rules
}

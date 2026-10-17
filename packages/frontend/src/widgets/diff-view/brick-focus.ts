import { fromDisplayLine } from '@entities/review/changes'
import { brickIdentity, bricksOf } from '@entities/review/guide/bricks'
import { changeSpan } from '@entities/review/guide/navigation'

import { brickHolding } from './brick-mark'
import { brickWindow } from './brick-window'
import { pendingJumpTarget, setPendingJump } from './comment-jump'
import { diffCtx } from './context'
import { cursorSelection } from './cursor'
import { changeAtRow } from './cursor-change'
import { D } from './runtime'

import type { Brick } from '@entities/review/guide/bricks'
import type { ChangeState, ReviewFile } from '@entities/review/model'
import type { RowWindow } from '@shared/diff-renderer/trim-rows'
import type { Side } from '@shared/diff-renderer/types'
import type { CutSource } from './brick-window'
import type { BrickFocus } from './runtime'

// The brick view (L3): which brick the shown file's code is cut to (its rows: brick-window.ts).
// The brick is chosen once and kept: a poll, a verdict or a click inside it re-cuts the same brick; a landing (a change step, a pane row, a reference) moves it to the brick it lands in.

// The brick last cut to; forgotten when the mode is off, so the next entry starts from the cursor.
let focusedKey: string | null = null

type RawPoint = { side: Side; line: number }

// The brick holding a raw line: the block anchored on it, else the narrowest declaration whose lines hold it.
function keyAt(changes: readonly ChangeState[], at: RawPoint): string | null {
	const block = changes.find(
		change =>
			change.side === at.side &&
			at.line >= change.lineNumber &&
			at.line <= (change.endLine ?? change.lineNumber),
	)
	if (block) return brickIdentity(block).key
	const symbol = brickHolding(at.side, at.line)
	const owner = symbol && changes.find(change => change.symbol === symbol)
	if (!owner) return null
	return brickIdentity(owner).key
}

// The cursor holds displayed rows: the block drawn on its row (either side of a replacement), else the declaration around its raw line.
function cursorKey(changes: readonly ChangeState[]): string | null {
	const cursor = cursorSelection()
	if (!cursor) return null
	const at = { side: cursor.side, line: cursor.lineNumber }
	const block = changeAtRow(at)
	if (block) return brickIdentity(block).key
	return keyAt(changes, {
		side: at.side,
		line: fromDisplayLine(at.side, at.line, D.lineMap),
	})
}

function landingOn(file: ReviewFile): RawPoint | null {
	const target = pendingJumpTarget()
	if (
		!target ||
		target.path !== file.path ||
		target.fileLevel ||
		target.unanchored
	)
		return null
	return { side: target.side, line: target.lineNumber }
}

// A landing on the file itself: its comments, or a comment whose line is gone.
function isFileLanding(file: ReviewFile): boolean {
	const target = pendingJumpTarget()
	return target?.path === file.path && (target.fileLevel || target.unanchored)
}

// With no brick on screen and no cursor, the cut opens on the file's first brick with the cursor on its first block, so the strip names it.
function landOnFirst(brick: Brick): void {
	const [block] = brick.changes
	if (block)
		setPendingJump({
			path: block.path,
			side: block.side,
			lineNumber: block.lineNumber,
			fileLevel: false,
			unanchored: false,
		})
}

// First match wins: the brick a pending landing goes to (none for a landing on the file itself), the brick already cut to, the brick under the cursor, the file's first.
function chooseBrick(
	file: ReviewFile,
	changes: readonly ChangeState[],
): Brick | null {
	if (isFileLanding(file)) return null
	const bricks = bricksOf(changes)
	const byKey = (key: string | null): Brick | undefined =>
		bricks.find(brick => brick.key === key)
	const landing = landingOn(file)
	if (landing) return byKey(keyAt(changes, landing)) ?? null
	const kept = byKey(focusedKey) ?? byKey(cursorKey(changes))
	if (kept) return kept
	const [first] = bricks
	if (!first) return null
	landOnFirst(first)
	return first
}

// The file's blocks either side of the brick, in the hub's order (the file's): where the change keys go from its edge.
function edges(
	changes: readonly ChangeState[],
	brick: Brick,
): Pick<BrickFocus, 'next' | 'prev'> {
	const inside = new Set(brick.changes.map(change => change.id))
	const next = changes[changes.findLastIndex(c => inside.has(c.id)) + 1]
	const prev = changes[changes.findIndex(c => inside.has(c.id)) - 1]
	return {
		next: next ? changeSpan(next) : null,
		prev: prev ? changeSpan(prev) : null,
	}
}

export type FocusCut = {
	focus: BrickFocus
	window: RowWindow
	windowKey: string
}

// The brick this pass cuts the shown file to, and its rows; null draws the whole file: the mode is off, the file is oversized or has no brick, or a landing went where no brick is - to the file's comments, to code no brick holds - which leaves the mode, the reviewer having followed it out of the bricks.
export function focusCut(
	file: ReviewFile,
	changes: readonly ChangeState[],
	cut: CutSource,
): FocusCut | null {
	const { S } = diffCtx()
	if (!S.brickFocus) focusedKey = null
	if (!S.brickFocus || file.oversized) return null
	const brick = chooseBrick(file, changes)
	if (!brick) {
		if (pendingJumpTarget()?.path === file.path) S.brickFocus = false
		return null
	}
	focusedKey = brick.key
	const window = brickWindow(brick, cut)
	return {
		focus: { brick, ...edges(changes, brick) },
		window,
		windowKey: JSON.stringify(window),
	}
}

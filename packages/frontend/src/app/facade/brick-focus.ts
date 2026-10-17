import { currentFileOrNull, fromDisplayLine } from '@entities/review/changes'
import { setPendingJump } from '@widgets/diff-view/comment-jump'
import { cursorSelection } from '@widgets/diff-view/cursor'
import { D } from '@widgets/diff-view/runtime'

import { S } from '../store'

import { moveLayout } from './layout-motion'

import type { JumpTarget } from '@widgets/diff-view/comment-jump'

// The brick view (L3) in and out. Entering cuts the code to the brick under the cursor (the diff's own pass picks it: widgets/diff-view/brick-focus.ts); leaving draws the whole file back around the row the reviewer was on. Both play as the desk's layout motion: the code cross-fades from the file to its brick and back.

export function installBrickFocusBindings(): void {
	S.toggleBrickFocus = () => {
		if (S.brickFocus) leaveBrickFocus()
		else
			void moveLayout(() => {
				S.brickFocus = true
			})
	}
	// The explanation's way down from a domain to one of its bricks: the jump lands in it, and the pass cuts the code to the brick it landed in.
	S.focusBrick = span => {
		S.brickFocus = true
		S.jumpToSpan?.(span)
	}
}

// The cursor's row in the raw file, else the brick's first block: where the whole file opens again, scrolled to.
function returnPoint(): JumpTarget | null {
	const file = currentFileOrNull(S.state?.files, S.preview, S.fileIndex)
	if (!file) return null
	const cursor = cursorSelection()
	const [first] = D.focus?.brick.changes ?? []
	const at = cursor
		? {
				side: cursor.side,
				lineNumber: fromDisplayLine(
					cursor.side,
					cursor.lineNumber,
					D.lineMap,
				),
			}
		: first
	if (!at) return null
	return {
		path: file.path,
		side: at.side,
		lineNumber: at.lineNumber,
		fileLevel: false,
		unanchored: false,
	}
}

function leaveBrickFocus(): void {
	const back = returnPoint()
	void moveLayout(() => {
		S.brickFocus = false
		if (back) setPendingJump(back)
	})
}

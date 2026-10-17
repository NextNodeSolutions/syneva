import { currentFileOrNull, fromDisplayLine } from '@entities/review/changes'
import { brickNameOf } from '@entities/review/guide/brick-name'
import {
	changeAt,
	orderedDomainChanges,
} from '@entities/review/guide/navigation'
import { domainById } from '@entities/review/guide/resolution'
import { changeUnderCursor, cursorSelection } from '@widgets/diff-view/cursor'
import { D } from '@widgets/diff-view/runtime'

import { S } from '../store'

import type { CodePlace } from '@entities/review/guide/navigation'

// Where the cursor sits in the diff file on screen, as a raw line: the cursor holds displayed lines, the changes raw ones, and a decided block above shifts the two apart. Null on a preview or without a cursor.
export function cursorPlace(): CodePlace | undefined {
	const { state } = S
	const shown = currentFileOrNull(state?.files, S.preview, S.fileIndex)
	const cursor = cursorSelection()
	if (!shown || !cursor || S.preview || !S.codeOpen) return undefined
	// A removed row of a replacement block belongs to the block anchored on its added side: the place is the block's, so the count and the steps read the cursor as inside it.
	const under = changeUnderCursor()
	if (under)
		return {
			path: under.path,
			side: under.side,
			lineNumber: under.lineNumber,
		}
	return {
		path: shown.path,
		side: cursor.side,
		lineNumber: fromDisplayLine(cursor.side, cursor.lineNumber, D.lineMap),
	}
}

// The domain's change the cursor sits in, in reading order, and the brick under the cursor; no index between its blocks or with the code closed.
export function changePosition(): {
	index: number | null
	total: number
	brick: string | null
} | null {
	const { state } = S
	const domain = S.domainId ? domainById(state, S.domainId) : undefined
	if (!state || !domain) return null
	const ordered = orderedDomainChanges(domain, state)
	const place = cursorPlace()
	const current = place ? changeAt(ordered, place) : undefined
	// The brick is the cursor's whichever domain owns its block: the name is the brick view's one control, and f cuts to a block of another domain all the same.
	const under = place ? changeAt(state.changes, place) : undefined
	return {
		index: current ? ordered.indexOf(current) + 1 : null,
		total: ordered.length,
		// The brick view names the brick it draws wherever the cursor stands in it, a context row included.
		brick: D.focus?.brick.name ?? (under ? brickNameOf(under) : null),
	}
}

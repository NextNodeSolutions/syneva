import { flushSync } from 'react-dom'

import { guideInputs, hasGuide } from '@entities/review/guide/guide'
import { render } from '@pages/desk/render'
import { isMotionReduced } from '@shared/lib/motion'

import { S } from '../store'

// The desk's one layout motion: a move between the reading (the project level, a domain read full width) and the code plays as a view transition - the reading folds into its column while the code slides in beside it, and back (the names and curves: app/desk.css). The store change commits synchronously inside the transition (flushSync), so the browser captures the new layout from the real DOM, and the code's render is awaited up to SETTLE_MS: the motion carries the painted file when its contents are on hand and never holds the screen on a fetch.

// Long enough for a cached file to paint, short enough that a fetch never holds the screen.
const SETTLE_MS = 320

let isMoving = false
// The reviewer who brought the tree back by hand keeps it; until then the code opened from the reading folds it, so the explanation and the code share the width.
let isTreeKept = false
// Set while the tree is folded only because the code opened: the reading the code closes onto brings it back, so a level reads as the reviewer left it. A tree folded by hand stays folded.
let isFoldedForCode = false

export function isReading(): boolean {
	return hasGuide(guideInputs(S)) && (S.overviewOpen || !S.codeOpen)
}

function canTransition(): boolean {
	return (
		!isMoving &&
		!isMotionReduced() &&
		typeof document.startViewTransition === 'function'
	)
}

const settle = (): Promise<void> =>
	new Promise(resolve => {
		setTimeout(resolve, SETTLE_MS)
	})

// The move, then what follows from where it lands: back on a reading, the tree the code folded returns in the same motion.
function applyMove(move: () => void): void {
	move()
	if (!isFoldedForCode || !isReading()) return
	isFoldedForCode = false
	S.treeFolded = false
}

// Applies a move that changes what the center shows, and renders: as one motion when the browser can play it, at once otherwise. A move applied while another plays joins it.
export function moveLayout(move: () => void): Promise<void> {
	if (!canTransition()) {
		applyMove(move)
		return render()
	}
	isMoving = true
	const transition = document.startViewTransition(async () => {
		try {
			flushSync(() => applyMove(move))
		} finally {
			isMoving = false
		}
		await Promise.race([render(), settle()])
	})
	return transition.updateCallbackDone.catch(() => undefined)
}

export function foldTreeForCode(): void {
	if (isTreeKept || S.treeFolded) return
	S.treeFolded = true
	isFoldedForCode = true
}

// A move into the code: from the reading it plays as the motion, with the tree folded for the code's room; from the code it is the plain move (which renders on its own).
export function enterCode(move: () => void): void {
	if (!isReading()) {
		move()
		return
	}
	void moveLayout(() => {
		foldTreeForCode()
		move()
	})
}

export function toggleTree(): void {
	S.treeFolded = !S.treeFolded
	isTreeKept = !S.treeFolded
	isFoldedForCode = false
}

import { useRef } from 'react'

import type { Hold, Holder } from '@shared/lib/hold-listeners'

export type HeldCountdown = Hold & {
	// Count `ms` down from now (or from when the last holder lets go).
	start: (ms: number) => void
	stop: () => void
}

const NOT_HELD: Record<Holder, boolean> = { pointer: false, focus: false }

// A countdown the reader can hold: while the pointer is over its subject or focus is in it,
// the time left waits, and it runs on once both let go. It is driven from event handlers
// (the start, the hold's events), so it needs no effect; `onDone` runs when it reaches zero.
// A start is a new subject and a stop takes the subject away: focus cannot be in either, and
// a focused element that is removed sends no blur, so both let go of the focus hold. The
// pointer's hold stays with the pointer: a subject that appears under it is hovered.
export function useHeldCountdown(onDone: () => void): HeldCountdown {
	const timer = useRef<number | undefined>(undefined)
	const left = useRef({ ms: 0, since: 0 })
	const holders = useRef(NOT_HELD)

	const isHeld = (): boolean =>
		holders.current.pointer || holders.current.focus
	const run = (): void => {
		window.clearTimeout(timer.current)
		if (isHeld()) return
		left.current.since = Date.now()
		timer.current = window.setTimeout(onDone, Math.max(0, left.current.ms))
	}
	const pause = (): void => {
		window.clearTimeout(timer.current)
		left.current.ms -= Date.now() - left.current.since
	}
	// Pause when the first holder takes it, run on when the last one lets go.
	const setHolders = (next: Record<Holder, boolean>): void => {
		const wasHeld = isHeld()
		holders.current = next
		if (!wasHeld && isHeld()) pause()
		if (wasHeld && !isHeld()) run()
	}

	const dropFocus = (): void => {
		holders.current = { ...holders.current, focus: false }
	}

	return {
		start: ms => {
			dropFocus()
			left.current.ms = ms
			run()
		},
		stop: () => {
			window.clearTimeout(timer.current)
			dropFocus()
		},
		hold: holder => setHolders({ ...holders.current, [holder]: true }),
		release: holder => setHolders({ ...holders.current, [holder]: false }),
	}
}

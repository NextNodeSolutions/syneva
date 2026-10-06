import { useRef } from 'react'

import type { Hold, Holder } from '@shared/lib/hold-listeners'

export type HeldCountdown = Hold & {
	start: (ms: number) => void
	stop: () => void
}

const NOT_HELD: Record<Holder, boolean> = { pointer: false, focus: false }

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

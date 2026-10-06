import { useEffect, useRef, useState } from 'react'

import { isMotionReduced, MOTION_MS } from './motion'

// The cubic ease-out a count ticks on: fast off the old value, settling on the new one.
const EASE_POWER = 3

function eased(progress: number): number {
	return 1 - (1 - progress) ** EASE_POWER
}

// A number that ticks from what it showed to what it is now, on a frame clock, so a count that
// changes under the reviewer's eyes is seen changing. The first value shows at once unless
// `isFromZero` asks it to count up from nothing (an entrance). Reduced motion jumps.
export function useCountUp(
	target: number,
	{ isFromZero = false }: { isFromZero?: boolean } = {},
): number {
	const [shown, setShown] = useState(isFromZero ? 0 : target)
	// What the last frame showed: the next count starts from there, even mid-count.
	const shownRef = useRef(shown)
	// oxlint-disable-next-line nextnode/no-use-effect -- a frame clock: the browser's animation timer
	useEffect(() => {
		const from = shownRef.current
		const show = (count: number): void => {
			shownRef.current = count
			setShown(count)
		}
		if (from === target || isMotionReduced()) {
			show(target)
			return undefined
		}
		const start = performance.now()
		let frame = 0
		const tick = (time: number): void => {
			// The first frame's timestamp can precede `start`: a progress below zero would
			// ease past `from` and show a figure the count never holds.
			const progress = Math.min(
				1,
				Math.max(0, (time - start) / MOTION_MS.count),
			)
			show(Math.round(from + (target - from) * eased(progress)))
			if (progress < 1) frame = requestAnimationFrame(tick)
		}
		frame = requestAnimationFrame(tick)
		return (): void => cancelAnimationFrame(frame)
	}, [target])
	return shown
}

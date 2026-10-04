import { loopTimeline } from '@syneva/motion/loop-timeline'

import type { Easing } from '@syneva/motion/easing'
import type { Keyframes } from '@syneva/motion/engine'
import type { Frame, Frames } from '@syneva/motion/loop-timeline'

// One 14s clock: dispatch, open, read, decide, return. The static pose tells
// the whole story; only the three short signal strokes repaint, sheets move
// with transform and opacity. Times are fractions of the cycle, and every
// segment eases on its own.
const CYCLE_S = 14

// A length a piece reads from its styles. The minifier may rewrite a value,
// so it is parsed.
export const pixels = (element: Element, property: string): number =>
	Number.parseFloat(getComputedStyle(element).getPropertyValue(property))

type Timing = {
	times: readonly [number, ...number[]]
	ease: Easing
	delay?: number
}

// A piece states one value per time of its timing: a missing one is a bug in
// the piece, not a value to guess.
export function valueAt(
	values: readonly (string | number)[],
	index: number,
	property: string,
): string | number {
	const timedValue = values[index]
	if (timedValue === undefined)
		throw new Error(
			`The circuit's ${property} has no value for time ${index}: give it one per time.`,
		)
	return timedValue
}

// A piece is written as its values at six fractions of the cycle; they
// become the loop timeline's frames on the circuit's clock.
export function loop(
	element: Element,
	keyframes: Keyframes,
	{ times, ease, delay = 0 }: Timing,
): void {
	const frameAt = (time: number, index: number): Frame => ({
		time: time * CYCLE_S,
		props: Object.fromEntries(
			Object.entries(keyframes).map(([property, values]) => [
				property,
				valueAt(values, index, property),
			]),
		),
	})
	const [firstTime, ...laterTimes] = times
	const frames: Frames = [
		frameAt(firstTime, 0),
		...laterTimes.map((time, index) => frameAt(time, index + 1)),
	]
	loopTimeline(element, frames, { cycle: CYCLE_S, delay, easing: ease })
}

// Six values, one per time of a piece's timing: its resting value at the
// first two times, its other value at the middle two, its resting value
// again at the last two. The piece changes between the second and third
// times and changes back between the fourth and fifth.
export const blink = (on: number): (string | number)[] => [0, 0, on, on, 0, 0]
export const hold = (resting: string, held: string): string[] => [
	resting,
	resting,
	held,
	held,
	resting,
	resting,
]

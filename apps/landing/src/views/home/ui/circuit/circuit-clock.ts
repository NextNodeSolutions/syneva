import { loopTimeline } from '@syneva/motion/loop-timeline'

import type { Easing } from '@syneva/motion/easing'
import type { Keyframes } from '@syneva/motion/engine'
import type { Frame, Frames } from '@syneva/motion/loop-timeline'

// One 14s clock: the static pose tells the whole story; only the three short signal strokes repaint, sheets move with transform and opacity. Times are fractions of the cycle; every segment eases on its own.
const CYCLE_S = 14

// A length a piece reads from its styles; the minifier may rewrite the value, so it is parsed.
export const pixels = (element: Element, property: string): number =>
	Number.parseFloat(getComputedStyle(element).getPropertyValue(property))

type Timing = {
	times: readonly [number, ...number[]]
	ease: Easing
	delay?: number
}

// A piece states one value per time of its timing: a missing one is a bug in the piece, not a value to guess.
function valueAt(
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

type Runner = typeof loopTimeline

export function loop(
	element: Element,
	keyframes: Keyframes,
	{ times, ease, delay = 0 }: Timing,
	run: Runner = loopTimeline,
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
	run(element, frames, { cycle: CYCLE_S, delay, easing: ease })
}

// Six values, one per timing time: resting at the first two, the other value at the middle two, resting again at the last two - changes between the 2nd→3rd and 4th→5th times.
export const blink = (on: number): (string | number)[] => [0, 0, on, on, 0, 0]
export const hold = (resting: string, held: string): string[] => [
	resting,
	resting,
	held,
	held,
	resting,
	resting,
]

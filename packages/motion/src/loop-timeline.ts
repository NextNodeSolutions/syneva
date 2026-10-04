import { animate } from './engine'

import type { Easing } from './easing'

// A looping timeline: one clock drives every element, so a choreography can
// never drift out of sync. Frames are [seconds, props, easing of the segment
// that starts here]; 'hold' keeps the props until the next frame, then jumps
// (CSS steps(1, end)).
export type SegmentEasing = Easing | 'hold'
export type AnimatedProperties = Record<string, string | number>
export type Frame = readonly [
	seconds: number,
	props: AnimatedProperties,
	segment?: SegmentEasing,
]
// A timeline has at least one frame, and its first frame names the
// properties every other frame states.
export type Frames = readonly [Frame, ...Frame[]]
export type Clock = { cycle: number; delay: number; easing: Easing }

type Keyframe = { offset: number; props: AnimatedProperties; easing: Easing }

function expand(frames: Frames, clock: Clock): Keyframe[] {
	const keyframes: Keyframe[] = []
	frames.forEach(([time, props, segment], index) => {
		const offset = time / clock.cycle
		const easing = segment ?? clock.easing
		keyframes.push({
			offset,
			props,
			easing: easing === 'hold' ? 'linear' : easing,
		})
		const next = frames[index + 1]
		if (easing === 'hold' && next)
			keyframes.push({
				offset: next[0] / clock.cycle,
				props,
				easing: 'linear',
			})
	})
	const [first] = keyframes
	const last = keyframes.at(-1)
	if (first && first.offset > 0) keyframes.unshift({ ...first, offset: 0 })
	if (last && last.offset < 1) keyframes.push({ ...last, offset: 1 })
	return keyframes
}

// Every frame states every animated property: a missing one is a bug in the
// timeline, not a value to guess.
function valueAt({ offset, props }: Keyframe, name: string): string | number {
	const frameValue = props[name]
	if (frameValue === undefined)
		throw new Error(
			`The loop frame at ${offset} of the cycle has no ${name}: give every frame the same properties.`,
		)
	return frameValue
}

// Loops the frames forever on `element`, after the clock's start delay.
export function loopTimeline(
	element: Element,
	frames: Frames,
	clock: Clock,
): void {
	const keyframes = expand(frames, clock)
	const [[, firstProps]] = frames
	const values = Object.fromEntries(
		Object.keys(firstProps).map(name => [
			name,
			keyframes.map(keyframe => valueAt(keyframe, name)),
		]),
	)
	animate(element, values, {
		duration: clock.cycle,
		delay: clock.delay,
		repeat: Infinity,
		times: keyframes.map(frame => frame.offset),
		ease: keyframes.map(frame => frame.easing),
	})
}

import { animate } from 'motion/mini'

import type { Easing } from './easing'

// A looping timeline: one clock drives every element, so a choreography can
// never drift out of sync. Frames are [seconds, props, easing of the segment
// that starts here]; 'hold' keeps the props until the next frame, then jumps
// (CSS steps(1, end)).
export type SegmentEasing = Easing | 'hold'
export type Props = Record<string, string | number>
export type Frame = readonly [
	seconds: number,
	props: Props,
	segment?: SegmentEasing,
]
export type Clock = { cycle: number; delay: number; easing: Easing }

type Keyframe = { offset: number; props: Props; easing: Easing }

function expand(frames: readonly Frame[], clock: Clock): Keyframe[] {
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

// Loops the frames forever on `element`, after the clock's start delay.
export function track(
	element: Element | null,
	frames: readonly Frame[],
	clock: Clock,
): void {
	if (!element) return
	const keyframes = expand(frames, clock)
	const names = Object.keys(keyframes[0]?.props ?? {})
	const values = Object.fromEntries(
		names.map(name => [
			name,
			keyframes.map(frame => frame.props[name] ?? ''),
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

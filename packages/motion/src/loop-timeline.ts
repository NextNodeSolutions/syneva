import { animate } from './engine'

import type { Easing } from './easing'

// A looping timeline: one clock drives every element, so a choreography can
// never drift out of sync. A frame is the props at a time on the clock (in
// seconds), with the easing of the segment that starts there; 'hold' keeps
// the props until the next frame, then jumps (CSS steps(1, end)).
export type SegmentEasing = Easing | 'hold'
export type AnimatedProperties = Record<string, string | number>
export type Frame = {
	time: number
	props: AnimatedProperties
	easing?: SegmentEasing
}
// A timeline has at least one frame, and its first frame names the
// properties every other frame states.
export type Frames = readonly [Frame, ...Frame[]]
export type Clock = { cycle: number; delay: number; easing: Easing }

type LoopKeyframe = {
	offset: number
	props: AnimatedProperties
	easing: Easing
}

function expand(frames: Frames, clock: Clock): LoopKeyframe[] {
	const keyframes: LoopKeyframe[] = []
	frames.forEach(({ time, props, easing: segment }, index) => {
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
				offset: next.time / clock.cycle,
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
function valueAt(
	{ offset, props }: LoopKeyframe,
	name: string,
): string | number {
	const frameValue = props[name]
	if (frameValue === undefined)
		throw new Error(
			`The loop frame at ${offset} of the cycle has no ${name}: give every frame the same properties.`,
		)
	return frameValue
}

type PropertyValues = Record<string, (string | number)[]>

// Each animated property's values, one per keyframe.
function valuesOf(frames: Frames, keyframes: LoopKeyframe[]): PropertyValues {
	const [{ props: firstProps }] = frames
	return Object.fromEntries(
		Object.keys(firstProps).map(name => [
			name,
			keyframes.map(keyframe => valueAt(keyframe, name)),
		]),
	)
}

// Loops the frames forever on `element`, after the clock's start delay.
export function loopTimeline(
	element: Element,
	frames: Frames,
	clock: Clock,
): void {
	const keyframes = expand(frames, clock)
	animate(element, valuesOf(frames, keyframes), {
		duration: clock.cycle,
		delay: clock.delay,
		repeat: Infinity,
		times: keyframes.map(frame => frame.offset),
		ease: keyframes.map(frame => frame.easing),
	})
}

// A property's new value at one keyframe of a running loop. The new frames
// lay out the times the loop started with, so a missing value means they do
// not match.
function valueAtKeyframe(
	values: PropertyValues,
	name: string,
	index: number,
): string | number {
	const keyframeValue = (values[name] ?? [])[index]
	if (keyframeValue === undefined)
		throw new Error(
			`The running loop's ${name} has no new value for keyframe ${index}: retime it with frames at the times it started with.`,
		)
	return keyframeValue
}

// One running animation's keyframes, its properties set to their new values.
function retimed(
	running: ComputedKeyframe[],
	values: PropertyValues,
	names: string[],
): Keyframe[] {
	return running.map((keyframe, index) =>
		Object.assign(
			{},
			keyframe,
			Object.fromEntries(
				names.map(name => [name, valueAtKeyframe(values, name, index)]),
			),
		),
	)
}

// Gives a loop already running on `element` new values at the same frame
// times: each of its animations keeps its place in the cycle, and the
// keyframe at each time takes its new value.
export function retimeLoop(
	element: Element,
	frames: Frames,
	clock: Clock,
): void {
	const values = valuesOf(frames, expand(frames, clock))
	for (const { effect } of element.getAnimations()) {
		if (!(effect instanceof KeyframeEffect)) continue
		const running = effect.getKeyframes()
		const names = Object.keys(values).filter(name =>
			running.some(keyframe => name in keyframe),
		)
		if (names.length > 0)
			effect.setKeyframes(retimed(running, values, names))
	}
}

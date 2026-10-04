import { EASE } from '@syneva/motion/easing'
import { loopTimeline } from '@syneva/motion/loop-timeline'

import type { Easing } from '@syneva/motion/easing'
import type { Keyframes } from '@syneva/motion/engine'
import type { Frame, Frames } from '@syneva/motion/loop-timeline'

// One 14s clock: dispatch, open, read, decide, return. The static pose tells
// the whole story; only the three short signal strokes repaint, sheets move
// with transform and opacity. Times are fractions of the cycle, and every
// segment eases on its own.
const CYCLE_S = 14
// Each layer rests stacked, `rest` px down, and lifts open to its --lift
// (circuit.styles.ts, the static pose); a signal's dash is its
// --signal-size. The minifier may rewrite a value, so it is parsed.
const LAYERS = {
	critical: { rest: 0, delay: 0 },
	important: { rest: 10, delay: 0.06 },
	tested: { rest: 20, delay: 0.12 },
} as const
const SIGNALS = {
	in: { times: [0, 0.14, 0.15, 0.25, 0.26, 1], ease: EASE.review },
	out: { times: [0, 0.47, 0.48, 0.63, 0.64, 1], ease: 'linear' },
	return: { times: [0, 0.73, 0.74, 0.97, 0.98, 1], ease: 'linear' },
} as const satisfies Record<string, { times: number[]; ease: Easing }>

const pixels = (element: Element, property: string): number =>
	Number.parseFloat(getComputedStyle(element).getPropertyValue(property))

type Timing = {
	times: readonly [number, ...number[]]
	ease: Easing
	delay?: number
}

// A piece states one value per time of its timing: a missing one is a bug in
// the piece, not a value to guess.
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

// A piece is written as its values at six fractions of the cycle; they
// become the loop timeline's frames on the circuit's clock.
function loop(
	element: Element,
	keyframes: Keyframes,
	{ times, ease, delay = 0 }: Timing,
): void {
	const frameAt = (time: number, index: number): Frame => [
		time * CYCLE_S,
		Object.fromEntries(
			Object.entries(keyframes).map(([property, values]) => [
				property,
				valueAt(values, index, property),
			]),
		),
	]
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
const blink = (on: number): (string | number)[] => [0, 0, on, on, 0, 0]
const hold = (resting: string, held: string): string[] => [
	resting,
	resting,
	held,
	held,
	resting,
	resting,
]

const travel = (size: number, length: number): string[] => [
	`${size}px`,
	`${size}px`,
	`${size}px`,
	`${-length}px`,
	`${-length}px`,
	`${-length}px`,
]

type Part = (name: string) => Element

// The changeset is dispatched, then its review layers lift apart and their
// notes appear.
function unfold(svg: SVGSVGElement, part: Part): void {
	loop(
		part('dispatch'),
		{ transform: hold('translateY(0px)', 'translateY(-9px)') },
		{ times: [0, 0.06, 0.12, 0.19, 0.25, 1], ease: EASE.review },
	)
	Object.entries(LAYERS).forEach(([kind, { rest, delay }]) => {
		const layer = svg.querySelector(`[data-circuit-layer="${kind}"]`)
		if (!layer) return
		const lift = pixels(layer, '--lift')
		loop(
			layer,
			{
				transform: hold(
					`translateY(${rest}px)`,
					`translateY(${lift}px)`,
				),
			},
			{ times: [0, 0.25, 0.31, 0.54, 0.59, 1], ease: EASE.unfold, delay },
		)
	})
	svg.querySelectorAll('[data-circuit-part="note"]').forEach(note => {
		loop(
			note,
			{ opacity: blink(1) },
			{ times: [0, 0.28, 0.33, 0.49, 0.54, 1], ease: EASE.review },
		)
	})
}

// The reader's focus, the sweep across the change, the verdict and its seal.
function review(part: Part): void {
	loop(
		part('focus'),
		{ opacity: blink(1), transform: hold('scale(1.07)', 'scale(1)') },
		{ times: [0, 0.31, 0.35, 0.48, 0.53, 1], ease: EASE.review },
	)
	loop(
		part('owner'),
		{ opacity: blink(1) },
		{ times: [0, 0.32, 0.36, 0.48, 0.52, 1], ease: EASE.review },
	)
	loop(
		part('sweep'),
		{
			opacity: blink(0.1),
			transform: [
				'translate(0px, 0px)',
				'translate(0px, 0px)',
				'translate(0px, 0px)',
				'translate(220px, 110px)',
				'translate(220px, 110px)',
				'translate(220px, 110px)',
			],
		},
		{ times: [0, 0.35, 0.37, 0.44, 0.46, 1], ease: EASE.review },
	)
	loop(
		part('accepted'),
		{ opacity: blink(1) },
		{ times: [0, 0.63, 0.69, 0.95, 0.99, 1], ease: EASE.review },
	)
	loop(
		part('seal'),
		{
			opacity: blink(1),
			transform: hold('translateY(-4px)', 'translateY(0px)'),
		},
		{ times: [0, 0.65, 0.73, 0.95, 0.99, 1], ease: EASE.review },
	)
}

// The three signals travel their routes, measured from the live layout.
function travelSignals(svg: SVGSVGElement, lengths: Map<string, number>): void {
	Object.entries(SIGNALS).forEach(([name, { times, ease }]) => {
		const signal = svg.querySelector(`[data-signal="${name}"]`)
		if (!signal) return
		const route = signal.getAttribute('href')?.slice(1) ?? ''
		loop(
			signal,
			{
				opacity: blink(1),
				strokeDashoffset: travel(
					pixels(signal, '--signal-size'),
					lengths.get(route) ?? 0,
				),
			},
			{ times, ease },
		)
	})
}

export function playCircuit(
	svg: SVGSVGElement,
	lengths: Map<string, number>,
): void {
	const part: Part = name => {
		const found = svg.querySelector(`[data-circuit-part="${name}"]`)
		if (!found)
			throw new Error(
				`The review circuit has no ${name} part: mark it with data-circuit-part="${name}".`,
			)
		return found
	}
	unfold(svg, part)
	review(part)
	travelSignals(svg, lengths)
}

// A new layout re-measures the routes: the running signals keep their place
// on the clock and only their travel changes.
export function retimeSignals(
	svg: SVGSVGElement,
	lengths: Map<string, number>,
): void {
	Object.keys(SIGNALS).forEach(name => {
		const signal = svg.querySelector(`[data-signal="${name}"]`)
		if (!signal) return
		const route = signal.getAttribute('href')?.slice(1) ?? ''
		const size = pixels(signal, '--signal-size')
		signal.getAnimations().forEach(animation => {
			const { effect } = animation
			if (!(effect instanceof KeyframeEffect)) return
			const frames = effect.getKeyframes()
			if (!frames.some(frame => 'strokeDashoffset' in frame)) return
			const values = travel(size, lengths.get(route) ?? 0)
			effect.setKeyframes(
				frames.map((frame, index) =>
					Object.assign(frame, { strokeDashoffset: values[index] }),
				),
			)
		})
	})
}

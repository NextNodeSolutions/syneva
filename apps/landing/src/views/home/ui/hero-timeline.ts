import { EASE } from '@syneva/motion/easing'
import { loopTimeline } from '@syneva/motion/loop-timeline'

import type {
	AnimatedProperties,
	Clock,
	Frame,
} from '@syneva/motion/loop-timeline'
import type { StagePart } from './hero-stage-part'

// The hero instrument's clock and the moves its choreography is written in.
// One 16s clock drives every piece, so the round can never drift out of
// sync. Times are seconds on the clock.
const EASE_OUT = EASE.out
export const IN_OUT = EASE.inOut
export const SPRING = EASE.springWide
const CLOCK: Clock = { cycle: 16, delay: 0.9, easing: EASE_OUT }
// The loop closes by fading the round out, so the next one starts clean.
export const FADE_START = 15.1
export const FADE_END = 15.7

export type Palette = Record<
	| 'white'
	| 'mint'
	| 'paleMint'
	| 'green'
	| 'strong'
	| 'muted'
	| 'accent'
	| 'accentDeep',
	string
>

// Keyframe values are resolved without custom properties, so the palette is
// read once from the tokens; the only colour without a token is a literal.
export function palette(): Palette {
	const tokens = getComputedStyle(document.documentElement)
	const token = (name: string): string => tokens.getPropertyValue(name).trim()
	return {
		white: token('--white'),
		mint: token('--mint'),
		paleMint: '#f2f7f0',
		green: token('--green'),
		strong: token('--line-strong'),
		muted: token('--muted'),
		accent: token('--accent'),
		accentDeep: token('--accent-deep'),
	}
}

export type Part = Element | null
export type Scope = {
	one: (name: StagePart) => Part
	all: (name: StagePart) => Element[]
}

export const loop = (element: Part, frames: readonly Frame[]): void =>
	loopTimeline(element, frames, CLOCK)

// Appear at `start` over `length`, from the `from` pose to the `to` pose,
// stay, and leave with the round.
type Entrance = {
	length?: number
	from?: AnimatedProperties
	to?: AnimatedProperties
}
export function present(
	element: Part,
	start: number,
	{ length = 0.35, from = {}, to = {} }: Entrance = {},
): void {
	loop(element, [
		[0, { opacity: 0, ...from }],
		[start, { opacity: 0, ...from }],
		[start + length, { opacity: 1, ...to }],
		[FADE_START, { opacity: 1, ...to }],
		[FADE_END, { opacity: 0, ...to }],
	])
}

// A signal runs its route as one dash of `dash` hundredths of the route:
// it shows at `start`, enters from just before the route, takes `length` to
// leave past its end, and hides again.
const ROUTE_LENGTH = 100
const FLASH = 0.02
export function travel(
	element: Part,
	start: number,
	length: number,
	dash: number,
): void {
	if (!(element instanceof SVGGeometryElement)) return
	element.setAttribute('pathLength', String(ROUTE_LENGTH))
	element.style.setProperty('stroke-dasharray', `${dash} ${ROUTE_LENGTH}`)
	const end = -ROUTE_LENGTH
	loop(element, [
		[0, { opacity: 0, strokeDashoffset: dash }, 'linear'],
		[start, { opacity: 0, strokeDashoffset: dash }, 'linear'],
		[start + FLASH, { opacity: 1, strokeDashoffset: dash }, 'linear'],
		[start + length, { opacity: 1, strokeDashoffset: end }, 'linear'],
		[
			start + length + FLASH,
			{ opacity: 0, strokeDashoffset: end },
			'linear',
		],
	])
}

export function reveal(element: Part, start: number, length: number): void {
	const hidden = 'inset(-3px 100% -3px 0)'
	const shown = 'inset(-3px -3px -3px 0)'
	loop(element, [
		[0, { clipPath: hidden, opacity: 1 }],
		[start, { clipPath: hidden, opacity: 1 }, 'linear'],
		[start + length, { clipPath: shown, opacity: 1 }],
		[FADE_START, { clipPath: shown, opacity: 1 }],
		[FADE_END, { clipPath: shown, opacity: 0 }],
	])
}

export function draw(element: Part, start: number, length = 0.35): void {
	const dash = { strokeDasharray: '1 1' }
	loop(element, [
		[0, { ...dash, strokeDashoffset: 1, opacity: 1 }],
		[start, { ...dash, strokeDashoffset: 1, opacity: 1 }],
		[start + length, { ...dash, strokeDashoffset: 0, opacity: 1 }],
		[FADE_START, { ...dash, strokeDashoffset: 0, opacity: 1 }],
		[FADE_END, { ...dash, strokeDashoffset: 0, opacity: 0 }],
	])
}

export function pop(element: Part, start: number): void {
	loop(element, [
		[0, { opacity: 0, transform: 'scale(0)' }],
		[start, { opacity: 1, transform: 'scale(0)' }, SPRING],
		[start + 0.4, { opacity: 1, transform: 'none' }],
		[FADE_START, { opacity: 1, transform: 'none' }],
		[FADE_END, { opacity: 0, transform: 'none' }],
	])
}

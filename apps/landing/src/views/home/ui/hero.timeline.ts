import { EASE, toBezier } from '@syneva/motion/easing'
import { track } from '@syneva/motion/timeline'

import type { Clock, Frame, Props } from '@syneva/motion/timeline'

// The hero instrument's clock and the moves its choreography is written in.
// One 16s clock drives every piece, so the round can never drift out of
// sync. Times are seconds on the clock.
const EASE_OUT = toBezier(EASE.out)
export const IN_OUT = toBezier(EASE.inOut)
export const SPRING = toBezier(EASE.springWide)
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
	one: (name: string) => Part
	all: (name: string) => Element[]
}

export const loop = (element: Part, frames: readonly Frame[]): void =>
	track(element, frames, CLOCK)

export const setBox = (element: Part, origin: string, box?: string): void => {
	if (!(element instanceof SVGElement)) return
	element.style.setProperty('transform-origin', origin)
	if (box) element.style.setProperty('transform-box', box)
}

// Appear at `start` over `length`, from the `from` pose to the `to` pose,
// stay, and leave with the round.
type Entrance = { length?: number; from?: Props; to?: Props }
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

export function travel(element: Part, start: number, length: number): void {
	loop(element, [
		[0, { opacity: 0, strokeDashoffset: 8 }, 'linear'],
		[start, { opacity: 0, strokeDashoffset: 8 }, 'linear'],
		[start + 0.02, { opacity: 1, strokeDashoffset: 8 }, 'linear'],
		[start + length, { opacity: 1, strokeDashoffset: -100 }, 'linear'],
		[
			start + length + 0.02,
			{ opacity: 0, strokeDashoffset: -100 },
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

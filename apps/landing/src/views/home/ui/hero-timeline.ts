import { EASE } from '@syneva/motion/easing'
import { loopTimeline } from '@syneva/motion/loop-timeline'
import { PATH_LENGTH } from '@syneva/motion/poses'

import type {
	AnimatedProperties,
	Clock,
	Frames,
} from '@syneva/motion/loop-timeline'
import type { StagePart } from './hero-stage-part'

// One 16s clock drives every piece, so the round can never drift out of sync.
const CLOCK: Clock = { cycle: 16, delay: 0.9, easing: EASE.out }
export const FADE_START = 15.1
export const FADE_END = 15.7

export type Scope = {
	one: (name: StagePart) => SVGElement
	all: (name: StagePart) => Element[]
}

export const loop = (element: Element, frames: Frames): void =>
	loopTimeline(element, frames, CLOCK)

type Entrance = {
	length?: number
	from?: AnimatedProperties
	to?: AnimatedProperties
}
export function present(
	element: Element,
	start: number,
	{ length = 0.35, from = {}, to = {} }: Entrance = {},
): void {
	loop(element, [
		{ time: 0, props: { opacity: 0, ...from } },
		{ time: start, props: { opacity: 0, ...from } },
		{ time: start + length, props: { opacity: 1, ...to } },
		{ time: FADE_START, props: { opacity: 1, ...to } },
		{ time: FADE_END, props: { opacity: 0, ...to } },
	])
}

const FLASH = 0.02
export function travel(
	element: SVGElement,
	start: number,
	length: number,
	dash: number,
): void {
	element.setAttribute('pathLength', String(PATH_LENGTH.signal))
	element.style.setProperty(
		'stroke-dasharray',
		`${dash} ${PATH_LENGTH.signal}`,
	)
	const end = -PATH_LENGTH.signal
	loop(element, [
		{
			time: 0,
			props: { opacity: 0, strokeDashoffset: dash },
			easing: 'linear',
		},
		{
			time: start,
			props: { opacity: 0, strokeDashoffset: dash },
			easing: 'linear',
		},
		{
			time: start + FLASH,
			props: { opacity: 1, strokeDashoffset: dash },
			easing: 'linear',
		},
		{
			time: start + length,
			props: { opacity: 1, strokeDashoffset: end },
			easing: 'linear',
		},
		{
			time: start + length + FLASH,
			props: { opacity: 0, strokeDashoffset: end },
			easing: 'linear',
		},
	])
}

export function reveal(element: Element, start: number, length: number): void {
	const hidden = 'inset(-3px 100% -3px 0)'
	const shown = 'inset(-3px -3px -3px 0)'
	loop(element, [
		{ time: 0, props: { clipPath: hidden, opacity: 1 } },
		{
			time: start,
			props: { clipPath: hidden, opacity: 1 },
			easing: 'linear',
		},
		{ time: start + length, props: { clipPath: shown, opacity: 1 } },
		{ time: FADE_START, props: { clipPath: shown, opacity: 1 } },
		{ time: FADE_END, props: { clipPath: shown, opacity: 0 } },
	])
}

// A drawn path declares PATH_LENGTH.draw as its pathLength and hides behind one dash that long until it draws.
export function draw(element: Element, start: number, length = 0.35): void {
	const dash = { strokeDasharray: `${PATH_LENGTH.draw} ${PATH_LENGTH.draw}` }
	loop(element, [
		{
			time: 0,
			props: { ...dash, strokeDashoffset: PATH_LENGTH.draw, opacity: 1 },
		},
		{
			time: start,
			props: { ...dash, strokeDashoffset: PATH_LENGTH.draw, opacity: 1 },
		},
		{
			time: start + length,
			props: { ...dash, strokeDashoffset: 0, opacity: 1 },
		},
		{
			time: FADE_START,
			props: { ...dash, strokeDashoffset: 0, opacity: 1 },
		},
		{ time: FADE_END, props: { ...dash, strokeDashoffset: 0, opacity: 0 } },
	])
}

export function pop(element: Element, start: number): void {
	loop(element, [
		{ time: 0, props: { opacity: 0, transform: 'scale(0)' } },
		{
			time: start,
			props: { opacity: 1, transform: 'scale(0)' },
			easing: EASE.springWide,
		},
		{ time: start + 0.4, props: { opacity: 1, transform: 'none' } },
		{ time: FADE_START, props: { opacity: 1, transform: 'none' } },
		{ time: FADE_END, props: { opacity: 0, transform: 'none' } },
	])
}

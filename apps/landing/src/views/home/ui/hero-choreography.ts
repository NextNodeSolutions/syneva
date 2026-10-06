import { EASE } from '@syneva/motion/easing'

import { isRejected, placeOfBar } from './hero-round-part'
import {
	draw,
	FADE_END,
	FADE_START,
	loop,
	pop,
	present,
	reveal,
	travel,
} from './hero-timeline'
import { accept, decide, revise, send } from './hero-verdict'

import type { Frame } from '@syneva/motion/loop-timeline'
import type { Palette } from './hero-palette'
import type { Scope } from './hero-timeline'

function arrive({ one, all }: Scope): void {
	const scattered = [
		'translate(34px, 52px) rotate(-8deg)',
		'translate(62px, -8px) rotate(6deg)',
		'translate(18px, -100px) rotate(-3deg)',
	]
	all('card').forEach((card, position) => {
		const away = scattered[position] ?? 'none'
		const settle = 1.25 + position * 0.14
		loop(card, [
			{ time: 0, props: { opacity: 0, transform: away } },
			{
				time: 0.2 + position * 0.12,
				props: { opacity: 0, transform: away },
			},
			{
				time: 0.55 + position * 0.12,
				props: { opacity: 1, transform: away },
			},
			{
				time: settle,
				props: { opacity: 1, transform: away },
				easing: EASE.springWide,
			},
			{ time: settle + 0.75, props: { opacity: 1, transform: 'none' } },
			{ time: FADE_START, props: { opacity: 1, transform: 'none' } },
			{ time: FADE_END, props: { opacity: 0, transform: 'none' } },
		])
	})
	writeBars({ one, all })
	draw(one('rail'), 2.05, 0.6)
	present(one('rail-dots'), 2.1, { length: 0.4 })
	present(one('more'), 2.2, { length: 0.4 })
	present(one('focus'), 2.45, {
		from: { transform: 'scale(1.1)' },
		to: { transform: 'none' },
	})
}

function writeBars({ all }: Scope): void {
	all('bar').forEach(bar => {
		const { card, row } = placeOfBar(bar)
		const write = 0.45 + card * 0.16 + row * 0.13
		const frames: [Frame, ...Frame[]] = [
			{ time: 0, props: { transform: 'scaleX(0)' } },
			{ time: write, props: { transform: 'scaleX(0)' } },
			{ time: write + 0.4, props: { transform: 'none' } },
		]
		if (isRejected(bar))
			frames.push(
				{ time: 13.15, props: { transform: 'none' } },
				{ time: 13.35, props: { transform: 'scaleX(0)' } },
				{ time: 13.45 + row * 0.12, props: { transform: 'scaleX(0)' } },
				{ time: 13.9 + row * 0.12, props: { transform: 'none' } },
			)
		loop(bar, frames)
	})
}

const caretBlink = (time: number): readonly [Frame, Frame] => [
	{ time: time, props: { opacity: 1 }, easing: 'hold' },
	{ time: time + 0.25, props: { opacity: 0 }, easing: 'hold' },
]

// The caption stays hidden from the change opening to the end of the round, so the loop wraps onto its fade-in without a flash.
function wait({ one }: Scope): void {
	loop(one('idle'), [
		{ time: 0, props: { opacity: 0 } },
		{ time: 0.3, props: { opacity: 1 } },
		{ time: 2.85, props: { opacity: 1 } },
		{ time: 3.05, props: { opacity: 0 } },
	])
	loop(one('caret'), [
		...caretBlink(0),
		...[0.5, 1, 1.5, 2, 2.5].flatMap(caretBlink),
	])
}

function read({ one, all }: Scope, color: Palette): void {
	travel(one('signal-in'), 2.75, 0.55, 8)
	present(one('head'), 3.05, { length: 0.3 })
	all('row').forEach((row, i) => reveal(row, 3.2 + i * 0.12, 0.45))
	present(one('band-removed'), 3.35, { length: 0.3 })
	loop(one('band-added'), [
		{ time: 0, props: { opacity: 0, fill: color.paleMint } },
		{ time: 3.5, props: { opacity: 0, fill: color.paleMint } },
		{ time: 3.8, props: { opacity: 1, fill: color.paleMint } },
		{ time: 8.45, props: { opacity: 1, fill: color.paleMint } },
		{ time: 8.8, props: { opacity: 1, fill: color.mint } },
		{ time: FADE_START, props: { opacity: 1, fill: color.mint } },
		{ time: FADE_END, props: { opacity: 0, fill: color.mint } },
	])
	present(one('strike'), 3.65, {
		from: { transform: 'scaleX(0)' },
		to: { transform: 'none' },
	})
	loop(one('sweep'), [
		{ time: 0, props: { opacity: 0, transform: 'translateY(0)' } },
		{ time: 4.05, props: { opacity: 0, transform: 'translateY(0)' } },
		{
			time: 4.2,
			props: { opacity: 1, transform: 'translateY(0)' },
			easing: EASE.inOut,
		},
		{ time: 5.05, props: { opacity: 1, transform: 'translateY(96px)' } },
		{ time: 5.25, props: { opacity: 0, transform: 'translateY(96px)' } },
	])
}

function ask({ one, all }: Scope): void {
	pop(one('chip'), 5.05)
	draw(one('leader'), 5.3, 0.3)
	present(one('thread'), 5.45, {
		from: { transform: 'translateY(8px)' },
		to: { transform: 'none' },
	})
	reveal(one('you'), 5.75, 0.6)
	loop(one('typing'), [
		{ time: 0, props: { opacity: 0 } },
		{ time: 6.45, props: { opacity: 0 } },
		{ time: 6.6, props: { opacity: 1 } },
		{ time: 7.05, props: { opacity: 1 } },
		{ time: 7.15, props: { opacity: 0 } },
	])
	all('typing-dot').forEach((dot, index) => {
		const beat = 6.55 + index * 0.1
		loop(dot, [
			{ time: 0, props: { opacity: 0.3 } },
			{ time: beat, props: { opacity: 0.3 } },
			{ time: beat + 0.12, props: { opacity: 1 } },
			{ time: beat + 0.24, props: { opacity: 0.3 } },
			{ time: beat + 0.36, props: { opacity: 1 } },
		])
	})
	reveal(one('agent-says'), 7.1, 0.65)
}

export function choreograph(scope: Scope, color: Palette): void {
	arrive(scope)
	wait(scope)
	read(scope, color)
	ask(scope)
	accept(scope, color)
	decide(scope)
	send(scope, color)
	revise(scope)
}

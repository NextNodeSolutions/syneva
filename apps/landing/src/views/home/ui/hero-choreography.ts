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

// The review round, phase by phase: files settle into a reading order, one
// change opens on the desk, you ask, the agent answers, you accept, the
// ledger fills, Send goes back to the agent and only the rejected file
// returns pending.
// 0.0 - 2.4  The agent's files arrive scattered, then settle in order.
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
			[0, { opacity: 0, transform: away }],
			[0.2 + position * 0.12, { opacity: 0, transform: away }],
			[0.55 + position * 0.12, { opacity: 1, transform: away }],
			[settle, { opacity: 1, transform: away }, EASE.springWide],
			[settle + 0.75, { opacity: 1, transform: 'none' }],
			[FADE_START, { opacity: 1, transform: 'none' }],
			[FADE_END, { opacity: 0, transform: 'none' }],
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

// Each card's code lines write in; the rejected file's lines are rewritten
// after the verdict comes back.
function writeBars({ all }: Scope): void {
	all('bar').forEach(bar => {
		const { card, row } = placeOfBar(bar)
		const write = 0.45 + card * 0.16 + row * 0.13
		const frames: [Frame, ...Frame[]] = [
			[0, { transform: 'scaleX(0)' }],
			[write, { transform: 'scaleX(0)' }],
			[write + 0.4, { transform: 'none' }],
		]
		if (isRejected(bar))
			frames.push(
				[13.15, { transform: 'none' }],
				[13.35, { transform: 'scaleX(0)' }],
				[13.45 + row * 0.12, { transform: 'scaleX(0)' }],
				[13.9 + row * 0.12, { transform: 'none' }],
			)
		loop(bar, frames)
	})
}

// The waiting caret shows at `time` and hides a quarter second later.
const caretBlink = (time: number): readonly [Frame, Frame] => [
	[time, { opacity: 1 }, 'hold'],
	[time + 0.25, { opacity: 0 }, 'hold'],
]

// Until a change opens, the desk says what it is waiting for. The caption
// stays hidden from then to the end of the round, so the loop wraps onto its
// fade-in without a flash.
function wait({ one }: Scope): void {
	loop(one('idle'), [
		[0, { opacity: 0 }],
		[0.3, { opacity: 1 }],
		[2.85, { opacity: 1 }],
		[3.05, { opacity: 0 }],
	])
	loop(one('caret'), [
		...caretBlink(0),
		...[0.5, 1, 1.5, 2, 2.5].flatMap(caretBlink),
	])
}

// 2.7 - 5.0  The change opens on the desk and you read it.
function read({ one, all }: Scope, color: Palette): void {
	travel(one('signal-in'), 2.75, 0.55, 8)
	present(one('head'), 3.05, { length: 0.3 })
	all('row').forEach((row, i) => reveal(row, 3.2 + i * 0.12, 0.45))
	present(one('band-removed'), 3.35, { length: 0.3 })
	loop(one('band-added'), [
		[0, { opacity: 0, fill: color.paleMint }],
		[3.5, { opacity: 0, fill: color.paleMint }],
		[3.8, { opacity: 1, fill: color.paleMint }],
		[8.45, { opacity: 1, fill: color.paleMint }],
		[8.8, { opacity: 1, fill: color.mint }],
		[FADE_START, { opacity: 1, fill: color.mint }],
		[FADE_END, { opacity: 0, fill: color.mint }],
	])
	present(one('strike'), 3.65, {
		from: { transform: 'scaleX(0)' },
		to: { transform: 'none' },
	})
	loop(one('sweep'), [
		[0, { opacity: 0, transform: 'translateY(0)' }],
		[4.05, { opacity: 0, transform: 'translateY(0)' }],
		[4.2, { opacity: 1, transform: 'translateY(0)' }, EASE.inOut],
		[5.05, { opacity: 1, transform: 'translateY(96px)' }],
		[5.25, { opacity: 0, transform: 'translateY(96px)' }],
	])
}

// 5.0 - 7.7  You ask on line 14; your agent answers on the same line.
function ask({ one, all }: Scope): void {
	pop(one('chip'), 5.05)
	draw(one('leader'), 5.3, 0.3)
	present(one('thread'), 5.45, {
		from: { transform: 'translateY(8px)' },
		to: { transform: 'none' },
	})
	reveal(one('you'), 5.75, 0.6)
	loop(one('typing'), [
		[0, { opacity: 0 }],
		[6.45, { opacity: 0 }],
		[6.6, { opacity: 1 }],
		[7.05, { opacity: 1 }],
		[7.15, { opacity: 0 }],
	])
	all('typing')
		.flatMap(group => Array.from(group.querySelectorAll('circle')))
		.forEach((dot, index) => {
			const beat = 6.55 + index * 0.1
			loop(dot, [
				[0, { opacity: 0.3 }],
				[beat, { opacity: 0.3 }],
				[beat + 0.12, { opacity: 1 }],
				[beat + 0.24, { opacity: 0.3 }],
				[beat + 0.36, { opacity: 1 }],
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

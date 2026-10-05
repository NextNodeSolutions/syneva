import { EASE } from '@syneva/motion/easing'

import { isRejected, turnOfVerdict } from './hero-round-part'
import { draw, FADE_END, FADE_START, loop, pop, travel } from './hero-timeline'

import type { Palette } from './hero-palette'
import type { Scope } from './hero-timeline'

// The second half of the hero round (see hero-choreography.ts): you give
// your verdict, the ledger records it, Send hands it to your agent, and the
// agent's next revision comes back.

// The cursor's pose: where its tip points, and its press.
const at = (x: number, y: number, scale = 1): { transform: string } => ({
	transform: `translate(${x}px, ${y}px) scale(${scale})`,
})

// 7.6 - 9.5  Your cursor accepts the change; the verdict travels on.
export function accept({ one, all }: Scope, color: Palette): void {
	loop(one('cursor'), [
		{ time: 0, props: { opacity: 0, ...at(650, 300) } },
		{ time: 7.55, props: { opacity: 0, ...at(650, 300) } },
		{
			time: 7.75,
			props: { opacity: 1, ...at(650, 300) },
			easing: EASE.inOut,
		},
		{ time: 8.25, props: { opacity: 1, ...at(504, 86) } },
		{ time: 8.32, props: { opacity: 1, ...at(504, 86, 0.8) } },
		{ time: 8.46, props: { opacity: 1, ...at(504, 86) } },
		{
			time: 10.35,
			props: { opacity: 1, ...at(504, 86) },
			easing: EASE.inOut,
		},
		{ time: 11.05, props: { opacity: 1, ...at(684, 334) } },
		{ time: 11.13, props: { opacity: 1, ...at(684, 334, 0.8) } },
		{ time: 11.27, props: { opacity: 1, ...at(684, 334) } },
		{ time: 11.8, props: { opacity: 1, ...at(684, 334) } },
		{ time: 12.2, props: { opacity: 0, ...at(700, 350) } },
	])
	loop(one('accept'), [
		{ time: 0, props: { fill: color.white, stroke: color.strong } },
		{ time: 8.32, props: { fill: color.white, stroke: color.strong } },
		{ time: 8.5, props: { fill: color.mint, stroke: color.green } },
		{ time: FADE_START, props: { fill: color.mint, stroke: color.green } },
		{ time: FADE_END, props: { fill: color.white, stroke: color.strong } },
	])
	loop(one('accept-glyph'), [
		{ time: 0, props: { stroke: color.muted } },
		{ time: 8.32, props: { stroke: color.muted } },
		{ time: 8.5, props: { stroke: color.green } },
		{ time: FADE_START, props: { stroke: color.green } },
		{ time: FADE_END, props: { stroke: color.muted } },
	])
	all('gutter-check').forEach((check, i) => draw(check, 8.55 + i * 0.15, 0.3))
	travel(one('signal-out'), 8.95, 0.5, 8)
}

// 9.4 - 10.8  Every file gets your verdict, one turn after another; the
// ledger fills.
export function decide({ one, all }: Scope): void {
	const verdicts = all('verdict')
	verdicts.forEach(verdict => {
		const start = 9.4 + turnOfVerdict(verdict) * 0.2
		if (!isRejected(verdict)) {
			pop(verdict, start)
			return
		}
		// The rejected file: undone now, pending again once the agent revises.
		loop(verdict, [
			{ time: 0, props: { opacity: 0, transform: 'scale(0)' } },
			{
				time: start,
				props: { opacity: 1, transform: 'scale(0)' },
				easing: EASE.springWide,
			},
			{ time: start + 0.4, props: { opacity: 1, transform: 'none' } },
			{ time: 14, props: { opacity: 1, transform: 'none' } },
			{ time: 14.25, props: { opacity: 0, transform: 'scale(.6)' } },
		])
	})
	// The revised file is pending again: progress gives back its share.
	const kept = verdicts.filter(verdict => !isRejected(verdict)).length
	const settled = `scaleX(${kept / verdicts.length})`
	loop(one('fill'), [
		{ time: 0, props: { transform: 'scaleX(0)', opacity: 1 } },
		{ time: 9.4, props: { transform: 'scaleX(0)', opacity: 1 } },
		{ time: 10.75, props: { transform: 'scaleX(1)', opacity: 1 } },
		{ time: 14.1, props: { transform: 'scaleX(1)', opacity: 1 } },
		{ time: 14.5, props: { transform: settled, opacity: 1 } },
		{ time: FADE_START, props: { transform: settled, opacity: 1 } },
		{ time: FADE_END, props: { transform: settled, opacity: 0 } },
	])
	// The count reads complete only once every verdict is in.
	loop(one('progress-1'), [
		{ time: 0, props: { opacity: 0 } },
		{ time: 10.6, props: { opacity: 0 } },
		{ time: 10.8, props: { opacity: 1 } },
		{ time: 14.1, props: { opacity: 1 } },
		{ time: 14.25, props: { opacity: 0 } },
	])
	loop(one('progress-2'), [
		{ time: 0, props: { opacity: 0 } },
		{ time: 14.25, props: { opacity: 0 } },
		{ time: 14.45, props: { opacity: 1 } },
		{ time: FADE_START, props: { opacity: 1 } },
		{ time: FADE_END, props: { opacity: 0 } },
	])
}

// 11.1 - 13.1  Send: the verdict goes back to the agent.
export function send({ one }: Scope, color: Palette): void {
	loop(one('send-box'), [
		{ time: 0, props: { fill: color.accent } },
		{ time: 11.12, props: { fill: color.accent } },
		{ time: 11.22, props: { fill: color.accentDeep } },
		{ time: 11.6, props: { fill: color.accent } },
	])
	// The button reads "Sent" while the agent works, then offers the next round.
	loop(one('send-label'), [
		{ time: 0, props: { opacity: 1 } },
		{ time: 11.28, props: { opacity: 1 } },
		{ time: 11.4, props: { opacity: 0 } },
		{ time: 14.2, props: { opacity: 0 } },
		{ time: 14.4, props: { opacity: 1 } },
	])
	loop(one('send-sent'), [
		{ time: 0, props: { opacity: 0 } },
		{ time: 11.4, props: { opacity: 0 } },
		{ time: 11.55, props: { opacity: 1 } },
		{ time: 14.05, props: { opacity: 1 } },
		{ time: 14.2, props: { opacity: 0 } },
	])
	travel(one('signal-back'), 11.5, 1.6, 5)
}

// 13.1 - 14.4  The agent rewrites one file; it alone comes back pending.
export function revise({ one }: Scope): void {
	pop(one('rev'), 13.95)
	pop(one('row-pending'), 14.1)
	loop(one('round-1'), [
		{ time: 0, props: { opacity: 1 } },
		{ time: 14, props: { opacity: 1 } },
		{ time: 14.15, props: { opacity: 0 } },
		{ time: FADE_START, props: { opacity: 0 } },
		{ time: FADE_END, props: { opacity: 1 } },
	])
	loop(one('round-2'), [
		{ time: 0, props: { opacity: 0 } },
		{ time: 14.15, props: { opacity: 0 } },
		{ time: 14.35, props: { opacity: 1 } },
		{ time: FADE_START, props: { opacity: 1 } },
		{ time: FADE_END, props: { opacity: 0 } },
	])
}

import { EASE } from '@syneva/motion/easing'

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
		[0, { opacity: 0, ...at(650, 300) }],
		[7.55, { opacity: 0, ...at(650, 300) }],
		[7.75, { opacity: 1, ...at(650, 300) }, EASE.inOut],
		[8.25, { opacity: 1, ...at(504, 86) }],
		[8.32, { opacity: 1, ...at(504, 86, 0.8) }],
		[8.46, { opacity: 1, ...at(504, 86) }],
		[10.35, { opacity: 1, ...at(504, 86) }, EASE.inOut],
		[11.05, { opacity: 1, ...at(684, 334) }],
		[11.13, { opacity: 1, ...at(684, 334, 0.8) }],
		[11.27, { opacity: 1, ...at(684, 334) }],
		[11.8, { opacity: 1, ...at(684, 334) }],
		[12.2, { opacity: 0, ...at(700, 350) }],
	])
	loop(one('accept'), [
		[0, { fill: color.white, stroke: color.strong }],
		[8.32, { fill: color.white, stroke: color.strong }],
		[8.5, { fill: color.mint, stroke: color.green }],
		[FADE_START, { fill: color.mint, stroke: color.green }],
		[FADE_END, { fill: color.white, stroke: color.strong }],
	])
	loop(one('accept-glyph'), [
		[0, { stroke: color.muted }],
		[8.32, { stroke: color.muted }],
		[8.5, { stroke: color.green }],
		[FADE_START, { stroke: color.green }],
		[FADE_END, { stroke: color.muted }],
	])
	all('gutter-check').forEach((check, i) => draw(check, 8.55 + i * 0.15, 0.3))
	travel(one('signal-out'), 8.95, 0.5, 8)
}

const isRejected = (verdict: Element): boolean =>
	verdict.getAttribute('data-verdict') === 'no'

// 9.4 - 10.8  Every file gets your verdict, one turn after another; the
// ledger fills.
export function decide({ one, all }: Scope): void {
	const verdicts = all('verdict')
	verdicts.forEach(verdict => {
		const start = 9.4 + Number(verdict.getAttribute('data-turn')) * 0.2
		if (!isRejected(verdict)) {
			pop(verdict, start)
			return
		}
		// The rejected file: undone now, pending again once the agent revises.
		loop(verdict, [
			[0, { opacity: 0, transform: 'scale(0)' }],
			[start, { opacity: 1, transform: 'scale(0)' }, EASE.springWide],
			[start + 0.4, { opacity: 1, transform: 'none' }],
			[14, { opacity: 1, transform: 'none' }],
			[14.25, { opacity: 0, transform: 'scale(.6)' }],
		])
	})
	// The revised file is pending again: progress gives back its share.
	const kept = verdicts.filter(verdict => !isRejected(verdict)).length
	const settled = `scaleX(${kept / verdicts.length})`
	loop(one('fill'), [
		[0, { transform: 'scaleX(0)', opacity: 1 }],
		[9.4, { transform: 'scaleX(0)', opacity: 1 }],
		[10.75, { transform: 'scaleX(1)', opacity: 1 }],
		[14.1, { transform: 'scaleX(1)', opacity: 1 }],
		[14.5, { transform: settled, opacity: 1 }],
		[FADE_START, { transform: settled, opacity: 1 }],
		[FADE_END, { transform: settled, opacity: 0 }],
	])
	// The count reads complete only once every verdict is in.
	loop(one('progress-1'), [
		[0, { opacity: 0 }],
		[10.6, { opacity: 0 }],
		[10.8, { opacity: 1 }],
		[14.1, { opacity: 1 }],
		[14.25, { opacity: 0 }],
	])
	loop(one('progress-2'), [
		[0, { opacity: 0 }],
		[14.25, { opacity: 0 }],
		[14.45, { opacity: 1 }],
		[FADE_START, { opacity: 1 }],
		[FADE_END, { opacity: 0 }],
	])
}

// 11.1 - 13.1  Send: the verdict goes back to the agent.
export function send({ one }: Scope, color: Palette): void {
	loop(one('send-box'), [
		[0, { fill: color.accent }],
		[11.12, { fill: color.accent }],
		[11.22, { fill: color.accentDeep }],
		[11.6, { fill: color.accent }],
	])
	// The button reads "Sent" while the agent works, then offers the next round.
	loop(one('send-label'), [
		[0, { opacity: 1 }],
		[11.28, { opacity: 1 }],
		[11.4, { opacity: 0 }],
		[14.2, { opacity: 0 }],
		[14.4, { opacity: 1 }],
	])
	loop(one('send-sent'), [
		[0, { opacity: 0 }],
		[11.4, { opacity: 0 }],
		[11.55, { opacity: 1 }],
		[14.05, { opacity: 1 }],
		[14.2, { opacity: 0 }],
	])
	travel(one('signal-back'), 11.5, 1.6, 5)
}

// 13.1 - 14.4  The agent rewrites one file; it alone comes back pending.
export function revise({ one }: Scope): void {
	pop(one('rev'), 13.95)
	pop(one('row-pending'), 14.1)
	loop(one('round-1'), [
		[0, { opacity: 1 }],
		[14, { opacity: 1 }],
		[14.15, { opacity: 0 }],
		[FADE_START, { opacity: 0 }],
		[FADE_END, { opacity: 1 }],
	])
	loop(one('round-2'), [
		[0, { opacity: 0 }],
		[14.15, { opacity: 0 }],
		[14.35, { opacity: 1 }],
		[FADE_START, { opacity: 1 }],
		[FADE_END, { opacity: 0 }],
	])
}

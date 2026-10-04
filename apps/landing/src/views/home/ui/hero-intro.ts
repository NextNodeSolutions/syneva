import { EASE } from '@syneva/motion/easing'
import { animate } from '@syneva/motion/engine'
import { PATH_LENGTH, POSE_VALUES } from '@syneva/motion/poses'

import { introPartSelector } from './hero-intro-part'

import type { Easing } from '@syneva/motion/easing'
import type { AnimateOptions, Keyframes } from '@syneva/motion/engine'
import type { IntroPart } from './hero-intro-part'

// The headline's entrance, once the runtime boots: the gutters fade in, both
// lines rise out of their clips, the bands sweep behind them, the + and the
// check land, the underline draws under "decide", and the pitch, the figure
// and the principle strip follow.
type Step = {
	part: IntroPart
	keyframes: Keyframes
	duration: number
	delay: number
	ease?: Easing
	pseudoElement?: string
}

const fadeIn = { opacity: [0, 1] }
const rise = { opacity: [0, 1], transform: ['translateY(14px)', 'none'] }
const lineRise = { transform: [POSE_VALUES.lineRise, 'none'] }
const bandIn = { transform: ['scaleX(0)', 'scaleX(1)'] }
const markPop = { transform: ['scale(0) rotate(-30deg)', 'none'] }
// The check and the underline declare PATH_LENGTH.draw as their pathLength:
// the draw pose hides each behind one dash that long.
const draw = { strokeDashoffset: [PATH_LENGTH.draw, 0] }

const STEPS: Step[] = [
	{ part: 'gutter', keyframes: fadeIn, duration: 0.5, delay: 0.05 },
	{ part: 'agent-text', keyframes: lineRise, duration: 0.9, delay: 0.1 },
	{ part: 'human-text', keyframes: lineRise, duration: 0.9, delay: 0.2 },
	{
		part: 'agent-band',
		keyframes: bandIn,
		duration: 0.8,
		delay: 0.55,
		pseudoElement: '::before',
	},
	{
		part: 'human-band',
		keyframes: bandIn,
		duration: 0.8,
		delay: 1.15,
		pseudoElement: '::before',
	},
	{
		part: 'agent-mark',
		keyframes: markPop,
		duration: 0.5,
		delay: 0.6,
		ease: EASE.spring,
	},
	{
		part: 'human-mark',
		keyframes: markPop,
		duration: 0.4,
		delay: 1.2,
		ease: EASE.spring,
	},
	{
		part: 'human-check',
		keyframes: draw,
		duration: 0.5,
		delay: 1.3,
	},
	{
		part: 'underline',
		keyframes: draw,
		duration: 0.8,
		delay: 1.45,
	},
	{ part: 'news', keyframes: rise, duration: 0.7, delay: 0 },
	{ part: 'copy', keyframes: rise, duration: 0.8, delay: 0.5 },
	{
		part: 'stage',
		keyframes: {
			opacity: [0, 1],
			transform: ['translateY(24px)', 'none'],
			clipPath: ['inset(0 0 12% 0)', 'inset(0)'],
		},
		duration: 1.1,
		delay: 0.35,
	},
	{ part: 'principles', keyframes: fadeIn, duration: 0.8, delay: 0.9 },
]

// Starts every step and returns their playback, which hero.client.ts can
// complete at once. The figure is a scene: its step waits, paused, until it
// is in view.
export function playIntro(): ReturnType<typeof animate>[] {
	return STEPS.flatMap(
		({
			part,
			keyframes,
			duration,
			delay,
			ease = EASE.out,
			pseudoElement,
		}) => {
			const options: AnimateOptions = {
				duration,
				delay,
				ease,
				pseudoElement,
			}
			return [...document.querySelectorAll(introPartSelector(part))].map(
				target => animate(target, keyframes, options),
			)
		},
	)
}

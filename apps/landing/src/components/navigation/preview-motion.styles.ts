import * as stylex from '@stylexjs/stylex'
import { motionRoot } from '@syneva/motion/root.stylex'
import { media } from '@syneva/tokens/media.stylex'

import { dropdownMarker, navMarker, sceneMarker } from './markers.stylex'
import { navClock } from './nav.stylex'

import type { When } from '@syneva/tokens/when'

// The preview scenes' lines: a scene that starts illustrating replays them;
// the clock pauses while the menu is shut or the tab is hidden, and keyboard
// navigation shows the finished scene at once.
const illustrating = (): string =>
	stylex.when.ancestor(':is(.is-illustrating)', sceneMarker)
const shut = (): string =>
	stylex.when.ancestor('[data-open="false"]', dropdownMarker)
const paused = (): string =>
	stylex.when.ancestor('[data-motion-paused]', motionRoot)
const keyboard = (): string =>
	stylex.when.ancestor('[data-input="keyboard"]', navMarker)

const line = stylex.keyframes({
	from: { clipPath: 'inset(0 100% 0 0)' },
	to: { clipPath: 'inset(0 0 0 0)' },
})
const answer = stylex.keyframes({
	from: { opacity: 0, transform: 'translateY(8px)' },
	to: { opacity: 1, transform: 'translateY(0)' },
})

type Play = Record<
	| 'animationName'
	| 'animationDuration'
	| 'animationTimingFunction'
	| 'animationDelay'
	| 'animationFillMode'
	| 'animationPlayState',
	When<string | When<string>>
>

const play = (name: string, duration: string, delay: string): Play => ({
	animationName: {
		default: null,
		[media.motionSafe]: { default: null, [illustrating()]: name },
		[keyboard()]: 'none !important',
	},
	animationDuration: {
		default: null,
		[media.motionSafe]: { default: null, [illustrating()]: duration },
	},
	animationTimingFunction: {
		default: null,
		[media.motionSafe]: {
			default: null,
			[illustrating()]: navClock['--nav-ease'],
		},
	},
	animationDelay: {
		default: null,
		[media.motionSafe]: { default: null, [illustrating()]: delay },
	},
	animationFillMode: {
		default: null,
		[media.motionSafe]: { default: null, [illustrating()]: 'both' },
	},
	animationPlayState: {
		default: null,
		[shut()]: 'paused !important',
		[paused()]: 'paused !important',
	},
})

export const motions = stylex.create({
	// Only the last added line trails: the first one starts with the context.
	codeLine: play(line, '550ms', '0s'),
	lastAddedLine: play(line, '550ms', '170ms'),
	verdict: play(answer, '500ms', '450ms'),
	message: play(answer, '500ms', '140ms'),
	reply: play(answer, '500ms', '360ms'),
	planQuestion: play(line, '650ms', '160ms'),
})

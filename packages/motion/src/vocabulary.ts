import { EASE } from './easing'
import { animate } from './engine'
import { moveStart, PATH_LENGTH, POSE_VALUES } from './poses'
import { steps } from './steps'

import type { Easing } from './easing'
import type { Keyframes } from './engine'

// The drawing vocabulary. An element opts in with data-anim="<kind>" and an
// optional data-delay (seconds); its hidden pose is the matching poses.* style.
// Entrances play once, a beat after their section arrives; loops keep an
// arrived scene quietly alive. Timings are the site's motion grammar.
const LAG_S = 0.25
const TYPE_STEPS = 28
const PERCENT = 100
const HALF = 0.5

const { out, spring, settle } = EASE

// How long each entrance plays, in seconds.
const ENTRANCE_S = {
	draw: 1.1,
	fade: 0.7,
	rise: 0.8,
	pop: 0.55,
	sweep: 0.7,
	type: 0.9,
} as const
const MOVE = { duration: 1.1, fadeEnd: 0.25 } as const
// A signal loops over its cycle (seconds): it shows at `on`, arrives at
// `arrive` and hides at `off` (fractions of the cycle), drawn as one dash of
// `dash` hundredths of its path that travels the whole path.
const SIGNAL = {
	cycle: 3.2,
	on: 0.04,
	arrive: 0.64,
	off: 0.66,
	dash: 7,
	travel: -PATH_LENGTH.signal,
} as const
// A pulse dims to `low` opacity and back over its cycle (seconds), starting
// `lag` seconds after its section arrives.
const PULSE = { cycle: 2.4, low: 0.35, lag: 1.2 } as const
const BLINK_S = 1.1
const SPIN_S = 1

// The typed line uncovers its clip-path one character-width at a time.
// Both ends are the pose's own values; the steps between interpolate the
// right inset the way CSS does.
const typed = steps(TYPE_STEPS, progress => {
	if (progress === 0) return POSE_VALUES.typeClipped
	if (progress === 1) return POSE_VALUES.typeUncovered
	const right = (1 - progress) * PERCENT
	const outset = POSE_VALUES.typeOutset
	return `inset(-${outset}px calc(${right}% - ${progress * outset}px) -${outset}px 0)`
})

// Starters receive the element's data-delay; entrances and signals wait a
// beat (LAG_S) after the section arrives, pulses a longer one. An entrance
// plays once and hands back its playback (reveal.ts can complete it at once);
// Motion commits its finished pose and releases the animation.
type Target = HTMLElement | SVGElement
type Entrance = (element: Target, delay: number) => ReturnType<typeof animate>
type Loop = (element: Target, delay: number) => void
const lag = (delay: number): number => delay + LAG_S

// An entrance from the hidden pose to the markup's, eased as one segment.
// Motion resolves the keyframes it is given in place, so every element
// animates its own copy.
const entrance =
	(keyframes: Keyframes, duration: number, ease: Easing): Entrance =>
	(element, delay) =>
		animate(
			element,
			Object.fromEntries(
				Object.entries(keyframes).map(([name, values]) => [
					name,
					[...values],
				]),
			),
			{ duration, delay: lag(delay), ease },
		)

export const ENTRANCES = {
	draw: entrance(
		{ strokeDashoffset: [PATH_LENGTH.draw, 0] },
		ENTRANCE_S.draw,
		out,
	),
	fade: entrance({ opacity: [0, 1] }, ENTRANCE_S.fade, out),
	rise: entrance(
		{ opacity: [0, 1], transform: [POSE_VALUES.rise, 'none'] },
		ENTRANCE_S.rise,
		out,
	),
	pop: entrance({ transform: ['scale(0)', 'none'] }, ENTRANCE_S.pop, spring),
	sweep: entrance(
		{ transform: ['scaleX(0)', 'none'] },
		ENTRANCE_S.sweep,
		out,
	),
	type: (element, delay) =>
		animate(
			element,
			{ clipPath: typed.values },
			{
				duration: ENTRANCE_S.type,
				delay: lag(delay),
				times: typed.times,
				ease: 'linear',
			},
		),
	// Opacity lands in the first quarter; the travel uses the whole duration.
	move: (element, delay) => {
		const timing = { duration: MOVE.duration, delay: lag(delay) }
		return animate(
			element,
			{ opacity: [0, 1, 1], transform: [moveStart(element), 'none'] },
			{
				...timing,
				ease: settle,
				opacity: {
					...timing,
					times: [0, MOVE.fadeEnd, 1],
					ease: [settle, settle, settle],
				},
			},
		)
	},
} satisfies Record<string, Entrance>

export const LOOPS = {
	signal: (element, delay) => {
		element.style.setProperty(
			'stroke-dasharray',
			`${SIGNAL.dash} ${PATH_LENGTH.signal}`,
		)
		const shared = {
			duration: SIGNAL.cycle,
			delay: lag(delay),
			repeat: Infinity,
			ease: 'linear',
		} as const
		animate(
			element,
			{ opacity: [0, 1, 1, 0, 0] },
			{
				...shared,
				times: [0, SIGNAL.on, SIGNAL.arrive, SIGNAL.off, 1],
			},
		)
		animate(
			element,
			{
				strokeDashoffset: [
					SIGNAL.dash,
					SIGNAL.travel,
					SIGNAL.travel,
					SIGNAL.travel,
				],
			},
			{ ...shared, times: [0, SIGNAL.arrive, SIGNAL.off, 1] },
		)
	},
	pulse: (element, delay) => {
		animate(
			element,
			{ opacity: [1, PULSE.low, 1] },
			{
				duration: PULSE.cycle,
				delay: delay + PULSE.lag,
				repeat: Infinity,
				times: [0, HALF, 1],
				ease: [out, out, out],
			},
		)
	},
	blink: element => {
		animate(
			element,
			{ opacity: [1, 1, 0, 0] },
			{
				duration: BLINK_S,
				repeat: Infinity,
				times: [0, HALF, HALF, 1],
				ease: 'linear',
			},
		)
	},
	spin: element => {
		animate(
			element,
			{ transform: ['rotate(0deg)', 'rotate(360deg)'] },
			{ duration: SPIN_S, repeat: Infinity, ease: 'linear' },
		)
	},
} satisfies Record<string, Loop>

// The kinds a drawing element can name in data-anim.
export type LoopKind = keyof typeof LOOPS
export type VocabularyKind = keyof typeof ENTRANCES | LoopKind

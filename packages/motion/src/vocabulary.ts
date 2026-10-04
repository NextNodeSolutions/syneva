import { EASE, toBezier } from './easing'
import { animate } from './engine'
import { POSE_VALUES } from './poses'
import { steps } from './steps'

// The drawing vocabulary. An element opts in with data-anim="<kind>" and an
// optional data-delay (seconds); its hidden pose is the matching poses.* style.
// Entrances play once, a beat after their section arrives; loops keep an
// arrived scene quietly alive. Timings are the site's motion grammar.
const LAG_S = 0.25
const PULSE_LAG_S = 1.2
const TYPE_STEPS = 28
const PERCENT = 100

const out = toBezier(EASE.out)
const spring = toBezier(EASE.spring)
const settle = toBezier(EASE.settle)

const TIMING = {
	draw: 1.1,
	fade: 0.7,
	rise: 0.8,
	pop: 0.55,
	sweep: 0.7,
	type: 0.9,
	move: 1.1,
	moveFadeEnd: 0.25,
	signal: 3.2,
	signalOn: 0.04,
	signalArrive: 0.64,
	signalOff: 0.66,
	signalDash: 7,
	signalTravel: -100,
	pulse: 2.4,
	pulseLow: 0.35,
	blink: 1.1,
	spin: 1,
} as const

const HALF = 0.5

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

function moveFrom(element: HTMLElement | SVGElement): string {
	const x = element.style.getPropertyValue('--tx') || '0px'
	const y = element.style.getPropertyValue('--ty') || '0px'
	return `translate(${x}, ${y})`
}

// Starters receive the element's data-delay; entrances and signals wait a
// beat (LAG_S) after the section arrives, pulses a longer one. An entrance
// plays once: Motion commits its finished pose and releases the animation.
type Starter = (element: HTMLElement | SVGElement, delay: number) => void
const lag = (delay: number): number => delay + LAG_S

export const ENTRANCES = {
	draw: (element, delay) => {
		animate(
			element,
			{ strokeDashoffset: [1, 0] },
			{ duration: TIMING.draw, delay: lag(delay), ease: out },
		)
	},
	fade: (element, delay) => {
		animate(
			element,
			{ opacity: [0, 1] },
			{ duration: TIMING.fade, delay: lag(delay), ease: out },
		)
	},
	rise: (element, delay) => {
		animate(
			element,
			{ opacity: [0, 1], transform: [POSE_VALUES.rise, 'none'] },
			{ duration: TIMING.rise, delay: lag(delay), ease: out },
		)
	},
	pop: (element, delay) => {
		animate(
			element,
			{ transform: ['scale(0)', 'none'] },
			{ duration: TIMING.pop, delay: lag(delay), ease: spring },
		)
	},
	sweep: (element, delay) => {
		animate(
			element,
			{ transform: ['scaleX(0)', 'none'] },
			{ duration: TIMING.sweep, delay: lag(delay), ease: out },
		)
	},
	type: (element, delay) => {
		animate(
			element,
			{ clipPath: typed.values },
			{
				duration: TIMING.type,
				delay: lag(delay),
				times: typed.times,
				ease: 'linear',
			},
		)
	},
	// Opacity lands in the first quarter; the travel uses the whole duration.
	move: (element, delay) => {
		const timing = { duration: TIMING.move, delay: lag(delay) }
		animate(
			element,
			{ opacity: [0, 1, 1] },
			{
				...timing,
				times: [0, TIMING.moveFadeEnd, 1],
				ease: [settle, settle, settle],
			},
		)
		animate(
			element,
			{ transform: [moveFrom(element), 'none'] },
			{ ...timing, ease: settle },
		)
	},
} satisfies Record<string, Starter>

export const LOOPS = {
	signal: (element, delay) => {
		element.style.setProperty(
			'stroke-dasharray',
			`${TIMING.signalDash} ${PERCENT}`,
		)
		const shared = {
			duration: TIMING.signal,
			delay: lag(delay),
			repeat: Infinity,
			ease: 'linear',
		} as const
		animate(
			element,
			{ opacity: [0, 1, 1, 0, 0] },
			{
				...shared,
				times: [
					0,
					TIMING.signalOn,
					TIMING.signalArrive,
					TIMING.signalOff,
					1,
				],
			},
		)
		animate(
			element,
			{
				strokeDashoffset: [
					TIMING.signalDash,
					TIMING.signalTravel,
					TIMING.signalTravel,
					TIMING.signalTravel,
				],
			},
			{ ...shared, times: [0, TIMING.signalArrive, TIMING.signalOff, 1] },
		)
	},
	pulse: (element, delay) => {
		animate(
			element,
			{ opacity: [1, TIMING.pulseLow, 1] },
			{
				duration: TIMING.pulse,
				delay: delay + PULSE_LAG_S,
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
				duration: TIMING.blink,
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
			{ duration: TIMING.spin, repeat: Infinity, ease: 'linear' },
		)
	},
} satisfies Record<string, Starter>

// The kinds a drawing element can name in data-anim.
export type LoopKind = keyof typeof LOOPS
export type VocabularyKind = keyof typeof ENTRANCES | LoopKind

import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color } from '@syneva/design-system/tokens.stylex'

import { motionRoot } from './root.stylex'

import type { When } from '@syneva/design-system/when'

// Hidden pre-entrance poses, gated on motion-safe + an armed root, so the markup stays the finished pose for everyone else; the runtime animates from these to the markup's own.
const armed = (): string => stylex.when.ancestor('[data-motion]', motionRoot)
// Armed but never booted: the safety net shows everything after three seconds.
const stalled = (): string =>
	stylex.when.ancestor('[data-motion="pending"]', motionRoot)

// StyleX evaluates only file-local values here: the runtime's entrances (reveal.ts, vocabulary.ts) import this file.
const TYPE_OUTSET_PX = 4
export const POSE_VALUES = {
	itemRise: 'translateY(18px)',
	ruleOpacity: 0.9,
	rise: 'translateY(10px)',
	lineRise: 'translateY(108%)',
	typeOutset: TYPE_OUTSET_PX,
	typeClipped: `inset(-${TYPE_OUTSET_PX}px 100% -${TYPE_OUTSET_PX}px 0)`,
	typeUncovered: `inset(-${TYPE_OUTSET_PX}px -${TYPE_OUTSET_PX}px -${TYPE_OUTSET_PX}px 0)`,
} as const

// The pathLength the animated paths declare, so dash values here and in vocabulary.ts hold whatever a path measures: draw hides behind one full dash, signal travels in hundredths.
export const PATH_LENGTH = { draw: 1, signal: 100 } as const

// moveOffset() writes the (x, y) start offset onto the element; the move pose and moveStart() read it.
const OFFSET_X = '--tx'
const OFFSET_Y = '--ty'
const NO_OFFSET = '0px'

// A hidden pose holds a CSS keyword, length or colour, or a number.
type PoseValue = string | number

const hidden = (pose: PoseValue): When<When<PoseValue>> => ({
	default: null,
	[media.motionSafe]: { default: null, [armed()]: pose },
})
const whenStalled = (fallback: string): When<When<string>> => ({
	default: null,
	[media.motionSafe]: { default: null, [stalled()]: fallback },
})

const showAnyway = stylex.keyframes({ to: { opacity: 1, transform: 'none' } })
const drawAnyway = stylex.keyframes({ to: { strokeDashoffset: 0 } })
const typeAnyway = stylex.keyframes({
	to: { clipPath: POSE_VALUES.typeUncovered },
})
const bandAnyway = stylex.keyframes({ to: { transform: 'none' } })

type SafetyNet = Record<
	| 'animationName'
	| 'animationDuration'
	| 'animationTimingFunction'
	| 'animationDelay'
	| 'animationFillMode',
	When<When<string>>
>

const safetyNet = (name: string): SafetyNet => ({
	animationName: whenStalled(name),
	animationDuration: whenStalled('0s'),
	animationTimingFunction: whenStalled('linear'),
	animationDelay: whenStalled('3s'),
	animationFillMode: whenStalled('forwards'),
})

export const poses = stylex.create({
	// [data-reveal-item]: rises when its group arrives, staggered by its index (reveal.ts).
	revealItem: {
		opacity: hidden(0),
		transform: hidden(POSE_VALUES.itemRise),
		...safetyNet(showAnyway),
	},
	// [data-rule]: draws over the section's top border, then settles into it.
	rule: {
		position: hidden('relative'),
		'::before': {
			content: hidden("''"),
			position: hidden('absolute'),
			top: hidden('-1px'),
			left: hidden(0),
			width: hidden('100%'),
			height: hidden('1px'),
			backgroundColor: hidden(color['--accent']),
			transform: hidden('scaleX(0)'),
			transformOrigin: hidden('left'),
			opacity: hidden(POSE_VALUES.ruleOpacity),
		},
	},
	draw: {
		strokeDasharray: hidden(PATH_LENGTH.draw),
		strokeDashoffset: hidden(PATH_LENGTH.draw),
		...safetyNet(drawAnyway),
	},
	fade: { opacity: hidden(0), ...safetyNet(showAnyway) },
	rise: {
		opacity: hidden(0),
		transform: hidden(POSE_VALUES.rise),
		...safetyNet(showAnyway),
	},
	pop: {
		transformBox: hidden('fill-box'),
		transform: hidden('scale(0)'),
		transformOrigin: hidden('center'),
		...safetyNet(showAnyway),
	},
	sweep: {
		transformBox: hidden('fill-box'),
		transform: hidden('scaleX(0)'),
		transformOrigin: hidden('left center'),
		...safetyNet(showAnyway),
	},
	type: {
		clipPath: hidden(POSE_VALUES.typeClipped),
		...safetyNet(typeAnyway),
	},
	move: {
		opacity: hidden(0),
		transform: hidden(
			`translate(var(${OFFSET_X}, ${NO_OFFSET}), var(${OFFSET_Y}, ${NO_OFFSET}))`,
		),
		...safetyNet(showAnyway),
	},
	// Only ever seen in flight (deliberately without a safety net).
	signal: { opacity: 0 },
	spin: {
		transformBox: hidden('fill-box'),
		transformOrigin: hidden('center'),
	},
	// The home headline's intro: the line rises out of its overflow-hidden clip, the band's ::before sweeps in behind it.
	lineRise: {
		transform: hidden(POSE_VALUES.lineRise),
		...safetyNet(showAnyway),
	},
	band: {
		'::before': {
			transform: hidden('scaleX(0)'),
			...safetyNet(bandAnyway),
		},
	},
})

export const moveOffset = (x: number, y: number): { style: string } => ({
	style: `${OFFSET_X}:${x}px;${OFFSET_Y}:${y}px`,
})

export function moveStart(element: HTMLElement | SVGElement): string {
	const offset = (name: string): string =>
		element.style.getPropertyValue(name) || NO_OFFSET
	return `translate(${offset(OFFSET_X)}, ${offset(OFFSET_Y)})`
}

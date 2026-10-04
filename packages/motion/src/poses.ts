import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color } from '@syneva/design-system/tokens.stylex'

import { motionRoot } from './root.stylex'

import type { When } from '@syneva/design-system/when'

// Hidden poses: where an element waits before its entrance plays. They apply
// only with reduced-motion no-preference and an armed root, so the markup is
// always the finished pose for everyone else. The runtime animates from these
// values to the markup's own.
const armed = (): string => stylex.when.ancestor('[data-motion]', motionRoot)
// Armed but never booted: the safety net shows everything after three seconds.
const stalled = (): string =>
	stylex.when.ancestor('[data-motion="pending"]', motionRoot)

// The values the hidden poses hold, which the runtime's entrances (reveal.ts,
// vocabulary.ts) start from. StyleX evaluates only values local to this file,
// so they live here and the runtime imports them.
const TYPE_OUTSET_PX = 4
export const POSE_VALUES = {
	itemRise: 'translateY(18px)',
	// The accent rule rests just short of opaque while it draws.
	ruleOpacity: 0.9,
	rise: 'translateY(10px)',
	// A typed line's clip reaches this far past its box, left edge aside.
	typeOutset: TYPE_OUTSET_PX,
	typeClipped: `inset(-${TYPE_OUTSET_PX}px 100% -${TYPE_OUTSET_PX}px 0)`,
	typeUncovered: `inset(-${TYPE_OUTSET_PX}px -${TYPE_OUTSET_PX}px -${TYPE_OUTSET_PX}px 0)`,
} as const

const hidden = <T>(pose: T): When<When<T>> => ({
	default: null,
	[media.motionSafe]: { default: null, [armed()]: pose },
})
const whenStalled = <T>(fallback: T): When<When<T>> => ({
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
	// [data-reveal-item]: rises in when its group arrives, staggered by its
	// index in the group (see reveal.ts).
	revealItem: {
		opacity: hidden(0),
		transform: hidden(POSE_VALUES.itemRise),
		...safetyNet(showAnyway),
	},
	// [data-rule]: an accent rule draws over the section's top border, then
	// settles into it.
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
		strokeDasharray: hidden(1),
		strokeDashoffset: hidden(1),
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
	// The markup position is the resting one; --tx/--ty give the start offset.
	move: {
		opacity: hidden(0),
		transform: hidden('translate(var(--tx, 0px), var(--ty, 0px))'),
		...safetyNet(showAnyway),
	},
	// A travelling signal is only ever seen in flight.
	signal: { opacity: 0 },
	spin: {
		transformBox: hidden('fill-box'),
		transformOrigin: hidden('center'),
	},
	// Pieces the page's own intro animates: they keep only the safety net.
	stalledShow: safetyNet(showAnyway),
	stalledBand: { '::before': safetyNet(bandAnyway) },
})

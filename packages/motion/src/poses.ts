import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, ease } from '@syneva/design-system/tokens.stylex'

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
// The accent rule rests just short of opaque while it draws (see reveal.ts).
const RULE_OPACITY = 0.9

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
	to: { clipPath: 'inset(-4px -4px -4px 0)' },
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
	// [data-reveal-item]: rises in when its group arrives, staggered by the
	// --reveal-i index the runtime writes. The transition list is part of the
	// armed pose (it replaces an item's own transitions while armed).
	revealItem: {
		opacity: hidden(0),
		transform: hidden('translateY(18px)'),
		transition: hidden(
			`opacity .7s ${ease['--ease-out']}, transform .7s ${ease['--ease-out']}`,
		),
		transitionDelay: hidden('calc(min(var(--reveal-i, 0), 9) * 70ms)'),
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
			opacity: hidden(RULE_OPACITY),
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
		transform: hidden('translateY(10px)'),
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
		clipPath: hidden('inset(-4px 100% -4px 0)'),
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

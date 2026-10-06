import { curves } from '@syneva/design-system/curves.stylex'
import { queries } from '@syneva/design-system/media.stylex'

// The hub's motion runtime: the Web Animations API on the design system's curves, with no
// dependency of its own. Every animation here plays FROM a pose TO the element's resting
// style, filling backwards only while it waits for its delay: a page whose script fails, or
// whose animation never runs, shows its content where it belongs. Reduced motion skips the
// travel and keeps the end state at once.

// Times by what they carry (the animate reference's bands): an entrance a reviewer watches
// once, the stagger between siblings, the lead a nested group waits for its parent, a move
// that explains where something went, and a count that ticks to its new value.
// The budget is the page's: the last element of an entrance (a row nested in its group) settles
// within 700ms, so the reviewer never waits on the page to finish arriving.
export const MOTION_MS = {
	enter: 360,
	step: 28,
	nestedLead: 60,
	// The longest a list's stagger may run: past it, the rest enter together.
	staggerCap: 140,
	move: 560,
	count: 650,
	flash: 1400,
} as const

// The design system's deceleration: a confident arrival with no overshoot.
export const EASE_OUT = curves.out

// Whether this browser asks for less motion, read when the motion is about to play (the
// preference can change while the page is open).
export function isMotionReduced(): boolean {
	return matchMedia(queries.motionReduced).matches
}

// The pose an element enters from, named by the data-enter attribute it carries: a row rises
// into its place, a navigation item slides in from the edge it belongs to, a region that holds
// its position only fades, a drawn route traces itself and a chart's bar grows from its base.
const ENTER_POSE = {
	rise: { opacity: 0, transform: 'translateY(8px)' },
	slide: { opacity: 0, transform: 'translateX(-8px)' },
	fade: { opacity: 0 },
	pop: { opacity: 0, transform: 'scale(.96)' },
	// A rule that draws itself along its length (its transform-origin sets the direction).
	grow: { transform: 'scaleX(0)' },
	// A bar that rises from its baseline (its transform-origin is the baseline).
	growUp: { transform: 'scaleY(0)' },
} as const satisfies Record<string, Keyframe>

export type EnterPose = keyof typeof ENTER_POSE | 'draw'

function isEnterPose(name: string): name is EnterPose {
	return name === 'draw' || name in ENTER_POSE
}

// A drawn SVG path traces its length; its dash pattern (a dotted route keeps its own) returns
// once the trace has played.
function drawKeyframes(element: Element): Keyframe[] {
	const length =
		element instanceof SVGGeometryElement ? element.getTotalLength() : 0
	return [
		{ strokeDasharray: `${length} ${length}`, strokeDashoffset: length },
		{ strokeDasharray: `${length} ${length}`, strokeDashoffset: 0 },
	]
}

// Play one element's entrance after `delay` ms.
export function playEnter(element: Element, delay: number): void {
	const pose = element.getAttribute('data-enter') ?? 'rise'
	if (!isEnterPose(pose)) return
	const frames =
		pose === 'draw' ? drawKeyframes(element) : [ENTER_POSE[pose], {}]
	element.animate(frames, {
		duration: MOTION_MS.enter,
		delay,
		easing: EASE_OUT,
		fill: 'backwards',
	})
}

// The delay of the index-th sibling of a staggered list, capped so a long list never makes
// its last rows wait.
export function staggerDelay(index: number): number {
	return Math.min(index * MOTION_MS.step, MOTION_MS.staggerCap)
}

// Until when an entrance is still playing somewhere on the page: an element still arriving is
// not yet seen anywhere, so nothing travels (use-flip.ts) before it has settled.
let enteringUntil = 0

export function isEntering(): boolean {
	return performance.now() < enteringUntil
}

// Every [data-enter] element under `root`, entering in nested order: the outermost ones step in
// one after another, and the ones inside each of them step in after it, by a short lead. One
// pass over the tree; the delays are summed down the nesting.
export function playEntrance(root: Element, baseDelay = 0): void {
	if (isMotionReduced()) return
	let lastDelay = baseDelay
	const scheduled = new Map<Element, number>()
	const siblingsSeen = new Map<Element | null, number>()
	for (const element of root.querySelectorAll('[data-enter]')) {
		const parent = element.parentElement?.closest('[data-enter]') ?? null
		const isInside = parent !== null && root.contains(parent)
		const owner = isInside ? parent : null
		const index = siblingsSeen.get(owner) ?? 0
		siblingsSeen.set(owner, index + 1)
		const start = owner
			? (scheduled.get(owner) ?? baseDelay) + MOTION_MS.nestedLead
			: baseDelay
		const delay = start + staggerDelay(index)
		scheduled.set(element, delay)
		playEnter(element, delay)
		lastDelay = Math.max(lastDelay, delay)
	}
	const settles = performance.now() + lastDelay + MOTION_MS.enter
	enteringUntil = Math.max(enteringUntil, settles)
}

// A brief wash on something that just changed, fading back to its own ground: the eye lands on
// what moved without the element changing place. `token` names the palette variable the wash
// is drawn in (--wash), read from the page so either appearance gets its own.
export function playFlash(element: Element, token: string): void {
	if (isMotionReduced()) return
	const wash = getComputedStyle(element).getPropertyValue(token).trim()
	if (!wash) return
	element.animate([{ backgroundColor: wash }, {}], {
		duration: MOTION_MS.flash,
		easing: EASE_OUT,
	})
}

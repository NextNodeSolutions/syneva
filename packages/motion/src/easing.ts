import { curves } from '@syneva/design-system/curves.stylex'

// Motion takes a cubic-bezier as its four control points.
export type Bezier = readonly [number, number, number, number]
export type Easing = Bezier | 'linear'

const CONTROL_POINTS = 4

// Parses a CSS cubic-bezier(): the design system's curves below, or one a
// script reads from the computed style.
export function toBezier(css: string): Bezier {
	const points = (css.match(/-?[\d.]+/g) ?? []).map(Number)
	if (points.length !== CONTROL_POINTS)
		throw new Error(`not a cubic-bezier(): ${css}`)
	const [x1 = 0, y1 = 0, x2 = 0, y2 = 0] = points
	return [x1, y1, x2, y2]
}

// The runtime's curves as Motion's control points, parsed once from the CSS
// notation the stylesheets use. out and spring are the design system's (the
// stylesheets' --ease-out and --ease-spring); the others only the runtime
// uses.
export const EASE = {
	out: toBezier(curves.out),
	spring: toBezier(curves.spring),
	springWide: toBezier('cubic-bezier(.34, 1.45, .5, 1)'),
	inOut: toBezier('cubic-bezier(.65, 0, .35, 1)'),
	settle: toBezier('cubic-bezier(.65, 0, .2, 1)'),
	review: toBezier('cubic-bezier(.76, 0, .24, 1)'),
	unfold: toBezier('cubic-bezier(.23, 1, .32, 1)'),
} satisfies Record<string, Bezier>

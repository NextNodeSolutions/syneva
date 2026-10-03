// Easing curves in CSS notation, the same strings the stylesheets use
// (--ease-out and --ease-spring mirror the token values). Motion takes
// cubic-bézier control points, so toBezier() parses them at the call site.
export const EASE = {
	out: 'cubic-bezier(.2, 0, 0, 1)',
	spring: 'cubic-bezier(.34, 1.36, .5, 1)',
	springWide: 'cubic-bezier(.34, 1.45, .5, 1)',
	inOut: 'cubic-bezier(.65, 0, .35, 1)',
	settle: 'cubic-bezier(.65, 0, .2, 1)',
	review: 'cubic-bezier(.76, 0, .24, 1)',
	unfold: 'cubic-bezier(.23, 1, .32, 1)',
	menu: 'cubic-bezier(.22, .61, .36, 1)',
} as const

export type Bezier = [number, number, number, number]
export type Easing = Bezier | 'linear'

const CONTROL_POINTS = 4

export function toBezier(css: string): Bezier {
	const points = (css.match(/-?[\d.]+/g) ?? []).map(Number)
	if (points.length !== CONTROL_POINTS)
		throw new Error(`not a cubic-bezier(): ${css}`)
	const [x1 = 0, y1 = 0, x2 = 0, y2 = 0] = points
	return [x1, y1, x2, y2]
}

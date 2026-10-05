import * as stylex from '@stylexjs/stylex'

// The easing curves the stylesheets and the motion runtime share: the
// tokens' --ease-out and --ease-spring hold them, and @syneva/motion parses
// them into Motion's cubic-bezier control points.
export const curves = stylex.defineConsts({
	out: 'cubic-bezier(.2, 0, 0, 1)',
	spring: 'cubic-bezier(.34, 1.36, .5, 1)',
})

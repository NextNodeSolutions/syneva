import * as stylex from '@stylexjs/stylex'

// Shared by the stylesheets and @syneva/motion: the tokens' --ease-out/--ease-spring hold them; motion parses them into Motion's control points.
export const curves = stylex.defineConsts({
	out: 'cubic-bezier(.2, 0, 0, 1)',
	spring: 'cubic-bezier(.34, 1.36, .5, 1)',
})

import * as stylex from '@stylexjs/stylex'

// Every breakpoint the public site uses. Width queries are max-width ranges
// declared widest first: StyleX keeps the last matching query, the same
// cascade the original stylesheets relied on.
export const media = stylex.defineConsts({
	tablet: '@media (max-width: 1100px)',
	narrow: '@media (max-width: 900px)',
	stacked: '@media (max-width: 750px)',
	// The header folds its links behind the toggle.
	navToggle: '@media (max-width: 700px)',
	phone: '@media (max-width: 600px)',
	smallPhone: '@media (max-width: 400px)',
	tinyPhone: '@media (max-width: 360px)',
	finePointer: '@media (hover: hover) and (pointer: fine)',
	motionSafe: '@media (prefers-reduced-motion: no-preference)',
	motionReduced: '@media (prefers-reduced-motion: reduce)',
})

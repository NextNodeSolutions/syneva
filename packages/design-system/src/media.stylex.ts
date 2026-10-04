import * as stylex from '@stylexjs/stylex'

// Every breakpoint and preference query the public site uses. StyleX resolves
// only values local to a .stylex.ts file inside defineConsts (an import from
// a plain module is not static to it), so this file is their one home: the
// style keys wrap these queries, and the runtime's matchMedia() reads them
// bare.
const QUERY = {
	tablet: '(max-width: 1100px)',
	narrow: '(max-width: 900px)',
	stacked: '(max-width: 750px)',
	// The header folds its links behind the toggle.
	navToggle: '(max-width: 700px)',
	phone: '(max-width: 600px)',
	smallPhone: '(max-width: 400px)',
	tinyPhone: '(max-width: 360px)',
	finePointer: '(hover: hover) and (pointer: fine)',
	motionSafe: '(prefers-reduced-motion: no-preference)',
	motionReduced: '(prefers-reduced-motion: reduce)',
} as const

// The bare queries, for matchMedia() in the runtime scripts.
export const queries = stylex.defineConsts(QUERY)

// The style keys. Width queries are max-width ranges declared widest first:
// StyleX keeps the last matching query.
export const media = stylex.defineConsts({
	tablet: `@media ${QUERY.tablet}`,
	narrow: `@media ${QUERY.narrow}`,
	stacked: `@media ${QUERY.stacked}`,
	navToggle: `@media ${QUERY.navToggle}`,
	phone: `@media ${QUERY.phone}`,
	smallPhone: `@media ${QUERY.smallPhone}`,
	tinyPhone: `@media ${QUERY.tinyPhone}`,
	finePointer: `@media ${QUERY.finePointer}`,
	motionSafe: `@media ${QUERY.motionSafe}`,
	motionReduced: `@media ${QUERY.motionReduced}`,
})

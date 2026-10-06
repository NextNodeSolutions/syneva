import * as stylex from '@stylexjs/stylex'

// One home for every query: StyleX resolves defineConsts only from a .stylex.ts (a plain-module import is not static to it); style keys wrap these, runtime matchMedia() reads them bare.
const QUERY = {
	tablet: '(max-width: 1100px)',
	narrow: '(max-width: 900px)',
	stacked: '(max-width: 750px)',
	navToggle: '(max-width: 700px)',
	phone: '(max-width: 600px)',
	smallPhone: '(max-width: 400px)',
	tinyPhone: '(max-width: 360px)',
	finePointer: '(hover: hover) and (pointer: fine)',
	motionSafe: '(prefers-reduced-motion: no-preference)',
	motionReduced: '(prefers-reduced-motion: reduce)',
} as const

export const queries = stylex.defineConsts(QUERY)

// Width queries are max-width ranges declared widest first, and StyleX keeps the last matching query.
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

import * as stylex from '@stylexjs/stylex'

// One home in a .stylex.ts: StyleX resolves defineConsts statically, which a plain module's export is not; the keys mirror tokens.stylex.ts's custom-property contract (--duration-fast, --ease-out).
export const transition = stylex.defineConsts({
	fast: 'var(--duration-fast) var(--ease-out)',
})

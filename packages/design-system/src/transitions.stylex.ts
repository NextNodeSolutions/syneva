import * as stylex from '@stylexjs/stylex'

// The timing a quick state change runs on - a hover's colour, a press, a focus halo - for the
// recipes that ease several properties alike. Its one home is a .stylex.ts file: a style module
// can only read a value StyleX resolves statically, and a plain module's export is not one.
// defineConsts takes literals only, so the tokens are named by their custom properties, whose
// literal names are tokens.stylex.ts's contract (--duration-fast, --ease-out).
export const transition = stylex.defineConsts({
	fast: 'var(--duration-fast) var(--ease-out)',
})

import * as stylex from '@stylexjs/stylex'

// Bars that touch share a height, so their bottom rules read as one line across the seams.
export const frame = stylex.defineConsts({
	barHeight: '48px',
	subbarHeight: '40px',
	sidebarWidth: '232px',
	railWidth: '56px',
})

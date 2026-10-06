import * as stylex from '@stylexjs/stylex'

export const icon = stylex.create({
	base: {
		width: '14px',
		height: '14px',
		flexShrink: 0,
		verticalAlign: '-0.15em',
	},
	small: { width: '12px', height: '12px' },
	tiny: { width: '11px', height: '11px' },
	large: { width: '15px', height: '15px' },
})

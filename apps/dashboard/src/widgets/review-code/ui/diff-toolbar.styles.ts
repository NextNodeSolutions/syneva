import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'
import { transition } from '@syneva/design-system/transitions.stylex'

export const diffToolbar = stylex.create({
	bar: {
		display: 'flex',
		flexWrap: 'wrap',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: '12px',
	},
	switch: {
		display: 'inline-flex',
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line-strong'],
		backgroundColor: color['--white'],
	},
	option: {
		height: '26px',
		paddingInline: '10px',
		fontSize: '12px',
		color: { default: color['--ink'], ':hover': color['--accent'] },
		backgroundColor: 'transparent',
		borderWidth: 0,
		borderStyle: 'none',
		borderColor: 'transparent',
		transition: `color ${transition.fast}`,
	},
	chosen: {
		color: color['--accent'],
		backgroundColor: color['--wash'],
	},
})

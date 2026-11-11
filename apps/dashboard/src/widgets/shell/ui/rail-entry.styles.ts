import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'
import { transition } from '@syneva/design-system/transitions.stylex'

export const railEntry = stylex.create({
	link: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		width: '32px',
		height: '32px',
		color: { default: color['--muted'], ':hover': color['--ink'] },
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: 'transparent',
		backgroundColor: { default: 'transparent', ':hover': color['--field'] },
		transition: `color ${transition.fast}, background-color ${transition.fast}`,
	},
	current: {
		color: color['--accent'],
		borderColor: color['--accent-line'],
		backgroundColor: color['--wash'],
	},
})

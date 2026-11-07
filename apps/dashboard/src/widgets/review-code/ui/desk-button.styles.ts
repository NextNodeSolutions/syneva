import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'
import { transition } from '@syneva/design-system/transitions.stylex'

export const deskButton = stylex.create({
	quiet: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		flexShrink: 0,
		padding: 0,
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: 'transparent',
		color: { default: color['--muted'], ':hover': color['--ink'] },
		backgroundColor: { default: 'transparent', ':hover': color['--field'] },
		transition: `color ${transition.fast}, background-color ${transition.fast}`,
	},
	mini: { width: '22px', height: '22px' },
	compact: { width: '28px', height: '28px' },
})

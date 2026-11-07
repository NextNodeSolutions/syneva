import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'
import { transition } from '@syneva/design-system/transitions.stylex'

import { deskText } from './desk.stylex'

export const layoutSwitch = stylex.create({
	group: {
		display: 'inline-flex',
		flexShrink: 0,
		padding: '2px',
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line'],
		backgroundColor: color['--white'],
	},
	option: {
		minHeight: '18px',
		paddingBlock: 0,
		paddingInline: '6px',
		borderWidth: 0,
		fontFamily: font['--sans'],
		fontSize: deskText.label,
		fontWeight: 500,
		color: color['--muted'],
		backgroundColor: { default: 'transparent', ':hover': color['--field'] },
		transition: `background-color ${transition.fast}`,
	},
	chosen: {
		color: color['--accent'],
		backgroundColor: color['--wash'],
	},
})

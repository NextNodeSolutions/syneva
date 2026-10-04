import * as stylex from '@stylexjs/stylex'
import { color, duration, ease } from '@syneva/design-system/tokens.stylex'

import { disclosureMarker } from './disclosure.stylex'

// Open and not folding away; .is-closing turns the chevron back early.
const opened = (): string =>
	stylex.when.ancestor(':not(.is-closing)[open]', disclosureMarker)

// Native <details> rows: a question that eases open onto its answer.
export const disclosure = stylex.create({
	// Ruled between rows, and above the first.
	row: {
		borderTopWidth: { default: null, ':first-child': '1px' },
		borderTopStyle: { default: null, ':first-child': 'solid' },
		borderTopColor: { default: null, ':first-child': color['--line'] },
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
	},
	summary: {
		listStyle: 'none',
		padding: '21px 34px 21px 0',
		cursor: 'pointer',
		fontSize: '16px',
		position: 'relative',
		transition: `color ${duration['--duration-fast']} ${ease['--ease-out']}`,
		color: { default: null, ':hover': color['--accent'] },
		'::-webkit-details-marker': { display: 'none' },
		'::after': {
			content: "''",
			position: 'absolute',
			right: '4px',
			top: { default: '27px', [opened()]: '32px' },
			width: '9px',
			height: '9px',
			borderRightWidth: '1px',
			borderRightStyle: 'solid',
			borderRightColor: 'currentColor',
			borderBottomWidth: '1px',
			borderBottomStyle: 'solid',
			borderBottomColor: 'currentColor',
			transform: {
				default: 'rotate(45deg)',
				[opened()]: 'rotate(225deg)',
			},
			transition: `transform ${duration['--duration-medium']} ${ease['--ease-out']}, top ${duration['--duration-medium']} ${ease['--ease-out']}`,
		},
	},
	answer: { fontSize: '15px', padding: '0 34px 24px 0', maxWidth: '640px' },
})

import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, ease, font } from '@syneva/design-system/tokens.stylex'

import { disclosureMarker } from './disclosure.stylex'

// Open and not folding away; .is-closing turns the chevron back early.
const opened = (): string =>
	stylex.when.ancestor(':not(.is-closing)[open]', disclosureMarker)

// Native <details> rows: a question that eases open onto its answer.
export const disclosure = stylex.create({
	row: {
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
	},
	firstRow: {
		borderTopWidth: '1px',
		borderTopStyle: 'solid',
		borderTopColor: color['--line'],
	},
	summary: {
		listStyle: 'none',
		padding: '21px 34px 21px 0',
		cursor: 'pointer',
		fontSize: '16px',
		position: 'relative',
		transition: `color .15s ${ease['--ease-out']}`,
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
			transition: `transform 200ms ${ease['--ease-out']}, top 200ms ${ease['--ease-out']}`,
		},
	},
	answer: { fontSize: '15px', padding: '0 34px 24px 0', maxWidth: '640px' },
	// The FAQ page's rows: a heavier question, a roomier answer.
	// No rule above the first row, none under the last.
	qaRow: {
		borderBottomWidth: { default: '1px', ':last-child': 0 },
		borderBottomStyle: { default: 'solid', ':last-child': 'none' },
		borderBottomColor: {
			default: color['--line'],
			':last-child': 'currentcolor',
		},
	},
	qaSummary: {
		fontSize: { default: '17px', [media.phone]: '16px' },
		fontWeight: 500,
		lineHeight: 1.45,
		padding: '22px 30px 22px 0',
	},
	qaAnswer: { fontSize: '15px', lineHeight: 1.75, padding: '0 26px 24px 0' },
	qaLink: {
		textDecoration: 'underline',
		textDecorationColor: color['--line-strong'],
		color: { default: null, ':hover': color['--accent'] },
	},
	qaCode: { font: `0.85em/1.7 ${font['--mono']}`, overflowWrap: 'anywhere' },
})

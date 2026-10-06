import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

export const qaDisclosure = stylex.create({
	row: {
		borderBottomWidth: { default: '1px', ':last-child': 0 },
		borderBottomStyle: { default: 'solid', ':last-child': 'none' },
		borderBottomColor: {
			default: color['--line'],
			':last-child': 'currentcolor',
		},
	},
	summary: {
		fontSize: { default: '17px', [media.phone]: '16px' },
		fontWeight: 500,
		lineHeight: 1.45,
		padding: '22px 30px 22px 0',
	},
	answer: { fontSize: '15px', lineHeight: 1.75, padding: '0 26px 24px 0' },
	link: {
		textDecoration: 'underline',
		textDecorationColor: color['--line-strong'],
		color: { default: null, ':hover': color['--accent'] },
	},
	code: { font: `0.85em/1.7 ${font['--mono']}`, overflowWrap: 'anywhere' },
})

import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/tokens/media.stylex'
import { color, font } from '@syneva/tokens/tokens.stylex'

const LINE = color['--line']

// The FAQ: an index of its topics, then one block per topic whose heading
// stays on the left (alternating would make answers harder to find).
export const qa = stylex.create({
	index: {
		display: 'grid',
		gridTemplateColumns: {
			default: 'repeat(4, minmax(0, 1fr))',
			[media.narrow]: 'repeat(2, minmax(0, 1fr))',
		},
		gap: 0,
		borderTopWidth: '1px',
		borderTopStyle: 'solid',
		borderTopColor: LINE,
	},
	topic: {
		display: 'block',
		padding: { default: '28px 24px', [media.phone]: '20px' },
		borderRightWidth: {
			default: '1px',
			':last-child': 0,
			[media.narrow]: {
				default: '1px',
				':nth-child(2)': 0,
				':last-child': 0,
			},
		},
		borderRightStyle: {
			default: 'solid',
			':last-child': 'none',
			[media.narrow]: {
				default: 'solid',
				':nth-child(2)': 'none',
				':last-child': 'none',
			},
		},
		borderRightColor: {
			default: LINE,
			':last-child': 'currentcolor',
			[media.narrow]: {
				default: LINE,
				':nth-child(2)': 'currentcolor',
				':last-child': 'currentcolor',
			},
		},
		borderTopWidth: {
			default: null,
			[media.narrow]: { default: null, ':nth-child(n + 3)': '1px' },
		},
		borderTopStyle: {
			default: null,
			[media.narrow]: { default: null, ':nth-child(n + 3)': 'solid' },
		},
		borderTopColor: {
			default: null,
			[media.narrow]: { default: null, ':nth-child(n + 3)': LINE },
		},
		backgroundColor: { default: null, ':hover': color['--wash'] },
		color: { default: null, ':hover': color['--accent'] },
	},
	topicTitle: {
		display: 'flex',
		justifyContent: 'space-between',
		gap: '10px',
		font: `500 16px/1.5 ${font['--sans']}`,
		fontSize: { default: null, [media.phone]: '14px' },
		marginBottom: '8px',
	},
	topicCount: {
		font: `12px/1.9 ${font['--mono']}`,
		color: color['--accent'],
	},
	topicBlurb: {
		display: 'block',
		font: `13px/1.65 ${font['--sans']}`,
		color: color['--muted'],
	},
	block: {
		gridTemplateColumns: { default: '0.8fr 1.2fr', [media.narrow]: '1fr' },
	},
	copy: {
		gridColumn: 1,
		gridRow: 1,
		alignSelf: 'start',
		paddingBottom: { default: '64px', [media.narrow]: '8px' },
	},
	list: {
		minWidth: 0,
		padding: {
			default: '26px 48px 36px',
			[media.narrow]: '0 30px 28px',
			[media.phone]: '0 20px 28px',
		},
		// `border-left: 0` once stacked resets the style and colour too.
		borderLeftWidth: { default: '1px', [media.narrow]: 0 },
		borderLeftStyle: { default: 'solid', [media.narrow]: 'none' },
		borderLeftColor: { default: LINE, [media.narrow]: 'currentcolor' },
	},
})

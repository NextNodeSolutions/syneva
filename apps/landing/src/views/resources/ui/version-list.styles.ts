import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

export const versionList = stylex.create({
	root: {
		listStyle: 'none',
		margin: 0,
		padding: 0,
		borderLeftWidth: '1px',
		borderLeftStyle: 'solid',
		borderLeftColor: color['--line-strong'],
		marginTop: { default: null, ':not(:first-child)': '32px' },
	},
	week: {
		position: 'relative',
		padding: '0 0 40px 30px',
		'::before': {
			content: "''",
			position: 'absolute',
			left: '-4px',
			top: '7px',
			width: '7px',
			height: '7px',
			backgroundColor: color['--accent'],
		},
	},
	date: { font: `12px ${font['--mono']}`, color: color['--accent'] },
	title: { margin: '6px 0 14px', fontSize: '21px' },
	changes: {
		margin: 0,
		padding: 0,
		listStyle: 'none',
		display: 'grid',
		gap: '8px',
	},
	change: {
		fontSize: '14.5px',
		color: color['--muted'],
		paddingLeft: { default: '64px', [media.phone]: 0 },
		paddingTop: { default: null, [media.phone]: '22px' },
		position: 'relative',
	},
	tag: {
		position: 'absolute',
		left: 0,
		top: '2px',
		font: `500 10px ${font['--mono']}`,
		letterSpacing: '.05em',
		textTransform: 'uppercase',
		padding: '1px 6px',
	},
	feat: { color: color['--green'], backgroundColor: color['--mint'] },
	fix: { color: color['--accent'], backgroundColor: color['--wash'] },
	perf: {
		color: color['--ink'],
		backgroundColor: color['--white'],
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line-strong'],
	},
})

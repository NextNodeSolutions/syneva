import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

import type { When } from '@syneva/design-system/when'

type Rule = {
	borderTopWidth: string
	borderTopStyle: string
	borderTopColor: string
}
const rule = (width: string, tone: string): Rule => ({
	borderTopWidth: width,
	borderTopStyle: 'solid',
	borderTopColor: tone,
})
const underline = {
	borderBottomWidth: '1px',
	borderBottomStyle: 'solid',
	borderBottomColor: color['--line'],
}
// A block that follows something in a prose body keeps its distance.
const afterFirst = (gap: string): { marginTop: When<string> } => ({
	marginTop: { default: null, ':not(:first-child)': gap },
})

// Plain prose: a heading column and a body column, ruled from the section
// above, stacking under 900px.
export const prose = stylex.create({
	root: {
		display: 'grid',
		gridTemplateColumns: {
			default: 'minmax(0, 1fr) minmax(0, 1.45fr)',
			[media.narrow]: 'minmax(0, 1fr)',
		},
		gap: { default: '72px', [media.narrow]: '28px' },
		...rule('1px', color['--line']),
	},
	title: { fontSize: 'clamp(30px, 3.4vw, 44px)' },
	text: { maxWidth: '620px', ...afterFirst('18px') },
})

// Numbered points, each under its own rule with an accent square.
export const ruledList = stylex.create({
	root: {
		listStyle: 'none',
		margin: 0,
		padding: 0,
		display: 'grid',
		gridTemplateColumns: '1fr',
		gap: '0 32px',
		...afterFirst('32px'),
	},
	item: { padding: '20px 0 26px' },
	index: { marginBottom: '12px' },
	head: {
		display: 'block',
		fontSize: '16px',
		fontWeight: 500,
		marginBottom: '6px',
	},
	text: { fontSize: '14px' },
})

// Key/value rows in mono, for flags, events and fields.
export const specTable = stylex.create({
	root: {
		...rule('1px', color['--line-strong']),
		fontSize: '14px',
		...afterFirst('32px'),
	},
	row: {
		display: 'grid',
		gridTemplateColumns: {
			default: 'minmax(0, 2fr) minmax(0, 3fr)',
			[media.phone]: '1fr',
		},
		gap: { default: '24px', [media.phone]: '4px' },
		padding: '13px 0',
		...underline,
		alignItems: 'baseline',
	},
	head: {
		font: `11px ${font['--mono']}`,
		letterSpacing: '.05em',
		textTransform: 'uppercase',
		color: color['--muted'],
		paddingBlock: '10px',
	},
	value: { color: color['--muted'] },
	key: {
		justifySelf: 'start',
		backgroundColor: 'transparent',
		padding: 0,
		color: color['--accent'],
		fontSize: '13px',
		overflowWrap: 'anywhere',
	},
})

// The hanging indent sets a wrapped continuation deeper than the source
// indents (up to 6 columns), so it never reads as a new line.
const HANG = 'calc(7ch + 10px)'
const line = {
	display: 'block',
	paddingLeft: HANG,
	textIndent: `calc(-1 * ${HANG})`,
}

// A terminal: "$" lines are commands (the prompt is drawn, not selectable),
// "#" lines comments, anything else output. Lines wrap rather than scroll,
// since a scrolled terminal hides its own prompt.
export const terminal = stylex.create({
	root: {
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--ink'],
		backgroundColor: color['--white'],
		minWidth: 0,
		...afterFirst('32px'),
	},
	top: {
		display: 'flex',
		alignItems: 'center',
		gap: '14px',
		padding: '10px 16px',
		...underline,
		font: `11px ${font['--mono']}`,
		color: color['--muted'],
	},
	dots: { display: 'flex', gap: '5px' },
	dot: {
		width: '8px',
		height: '8px',
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: {
			default: color['--line-strong'],
			':first-child': color['--accent'],
		},
		backgroundColor: { default: null, ':first-child': color['--wash'] },
	},
	body: {
		margin: 0,
		padding: { default: '18px 20px', [media.phone]: '16px' },
		font: `12.5px/1.9 ${font['--mono']}`,
		fontSize: { default: null, [media.phone]: '11.5px' },
		whiteSpace: 'pre-wrap',
		overflowWrap: 'anywhere',
	},
	command: { ...line, color: color['--ink'] },
	prompt: {
		color: color['--accent'],
		marginRight: '10px',
		userSelect: 'none',
	},
	comment: { ...line, color: color['--muted'] },
	output: { ...line, color: color['--ink'] },
})

// A boxed aside with a coloured square: a lead line and its explanation.
export const callout = stylex.create({
	root: {
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line-strong'],
		backgroundColor: color['--white'],
		padding: '20px 22px',
		display: 'grid',
		gridTemplateColumns: 'auto 1fr',
		gap: '14px',
		fontSize: '14.5px',
		...afterFirst('32px'),
		'::before': {
			content: "''",
			width: '8px',
			height: '8px',
			marginTop: '8px',
		},
	},
	open: { '::before': { backgroundColor: color['--accent'] } },
	settled: { '::before': { backgroundColor: color['--green'] } },
	lead: { color: color['--ink'] },
	rest: { color: color['--muted'], marginTop: '6px' },
})

import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

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
// since a scrolled terminal hides its own prompt. The terminal keeps its
// distance from what precedes it in a prose body.
export const terminal = stylex.create({
	root: {
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--ink'],
		backgroundColor: color['--white'],
		minWidth: 0,
		marginTop: { default: null, ':not(:first-child)': '32px' },
	},
	top: {
		display: 'flex',
		alignItems: 'center',
		gap: '14px',
		padding: '10px 16px',
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
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

import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// The handoff contract: the review event a Send returns, as fenced JSON.
// Long lines wrap instead of scrolling: a scrolled listing slides its gutter
// and the highlight bands out of view. The hanging indent keeps a wrapped
// continuation deeper than any source indent.
export const handoff = stylex.create({
	section: {
		display: 'grid',
		gridTemplateColumns: {
			default: 'minmax(0, 1fr) minmax(0, 1.2fr)',
			[media.tablet]: 'minmax(0, 1fr)',
		},
		gap: { default: '72px', [media.tablet]: '48px' },
		alignItems: 'center',
	},
	text: { marginTop: '22px', maxWidth: '470px' },
	code: { fontSize: '12.5px' },
	links: {
		display: 'flex',
		flexWrap: 'wrap',
		gap: '14px 28px',
		marginTop: '28px',
	},
	figure: {
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line-strong'],
		backgroundColor: color['--white'],
		minWidth: 0,
	},
	json: {
		margin: 0,
		padding: '20px 0',
		font: `12px/1.85 ${font['--mono']}`,
		color: color['--ink'],
		whiteSpace: 'pre-wrap',
		overflowWrap: 'anywhere',
	},
	caption: {
		font: `11px ${font['--mono']}`,
		color: color['--muted'],
		padding: '14px 22px',
		borderTopWidth: '1px',
		borderTopStyle: 'solid',
		borderTopColor: color['--line'],
	},
})

export const json = stylex.create({
	line: {
		display: 'block',
		padding: '0 22px 0 calc(22px + 8ch)',
		textIndent: '-8ch',
		borderLeftWidth: '2px',
		borderLeftStyle: 'solid',
		borderLeftColor: 'transparent',
	},
	yes: {
		backgroundColor: `color-mix(in srgb, ${color['--mint']} 60%, transparent)`,
		borderLeftColor: color['--green'],
	},
	no: {
		backgroundColor: `color-mix(in srgb, ${color['--wash']} 50%, transparent)`,
		borderLeftColor: color['--accent'],
	},
	ask: {
		backgroundColor: `color-mix(in srgb, ${color['--wash']} 25%, transparent)`,
		borderLeftColor: color['--signal'],
	},
	key: { color: color['--ink'] },
	string: { color: color['--green'] },
	number: { color: color['--accent'] },
	punctuation: { color: color['--muted'] },
})

import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font, layout } from '@syneva/design-system/tokens.stylex'

// The page's one wash band (the site's closing band), edge to edge in the frame: it cancels the
// listing's gutter and restores it as its own padding. It keeps the site's band height (its
// padding, never the window's) and sits on the footer's rule: the top margin takes whatever
// height is left, as paper under the head - the site's order of a paper section, the band,
// then the footer. The head above already makes the page's statement, so the band opens on a
// heading at a project's scale, then its actions on the left; the command and the variants of
// it on the right, ruled in petrol's rule tone.
export const emptyHub = stylex.create({
	root: {
		marginTop: 'auto',
		display: 'grid',
		gridTemplateColumns: {
			default: 'minmax(0, 1.15fr) minmax(0, 1fr)',
			[media.stacked]: 'minmax(0, 1fr)',
		},
		gap: {
			default: '64px',
			[media.narrow]: '40px',
			[media.stacked]: '36px',
		},
		marginInline: `calc(-1 * ${layout['--gutter']})`,
		paddingBlock: {
			default: '96px',
			[media.narrow]: '72px',
			[media.phone]: '56px',
		},
		paddingInline: layout['--gutter'],
		backgroundColor: color['--wash'],
	},
	heading: {
		fontSize: { default: '21px', [media.phone]: '19px' },
		fontWeight: 500,
		letterSpacing: '-.02em',
		lineHeight: 1.2,
		textWrap: 'balance',
	},
	text: {
		maxWidth: '420px',
		marginTop: '12px',
		marginBottom: '26px',
		fontSize: '15.5px',
		lineHeight: 1.6,
		color: color['--wash-ink'],
	},
	actions: {
		display: 'flex',
		flexWrap: 'wrap',
		alignItems: 'center',
		gap: '16px 24px',
	},
	install: { alignSelf: 'center', minWidth: 0 },
	label: {
		marginBottom: '10px',
		fontFamily: font['--mono'],
		fontSize: '11px',
		color: color['--wash-ink'],
	},
	// Clear of the chip's status line, which hangs under the chip out of flow.
	spec: {
		marginTop: '30px',
		borderTopWidth: '1px',
		borderTopStyle: 'solid',
		borderTopColor: color['--accent-line'],
	},
	specRow: {
		display: 'grid',
		gridTemplateColumns: {
			default: 'minmax(0, 1.25fr) minmax(0, 1fr)',
			[media.phone]: 'minmax(0, 1fr)',
		},
		gap: { default: '16px', [media.phone]: '2px' },
		alignItems: 'baseline',
		paddingBlock: '11px',
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--accent-line'],
		fontSize: '13.5px',
		color: color['--wash-ink'],
	},
	specKey: {
		fontFamily: font['--mono'],
		fontSize: '12.5px',
		color: color['--accent'],
		overflowWrap: 'anywhere',
	},
})

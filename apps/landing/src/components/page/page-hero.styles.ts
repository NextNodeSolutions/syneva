import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/tokens/media.stylex'
import { color, font } from '@syneva/tokens/tokens.stylex'

const LINE = color['--line']

// The page hero: words on the left, the page's own drawing on the right,
// stacking under 1100px. The hero carries its own padding around the copy
// column's padding, as the stylesheet it replaces layered them.
export const pageHero = stylex.create({
	root: {
		display: 'grid',
		gridTemplateColumns: {
			default: 'minmax(0, 5fr) minmax(0, 6fr)',
			[media.tablet]: 'minmax(0, 1fr)',
		},
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: LINE,
		padding: {
			default: '58px 48px 48px',
			[media.narrow]: '58px 30px 48px',
			[media.phone]: '40px 20px 36px',
		},
		position: 'relative',
	},
	copy: {
		paddingTop: { default: '44px', [media.phone]: '30px' },
		paddingInline: 'var(--gutter)',
		paddingBottom: { default: '64px', [media.tablet]: '52px' },
		display: 'flex',
		flexDirection: 'column',
	},
	crumbs: {
		display: 'flex',
		flexWrap: 'wrap',
		alignItems: 'center',
		gap: '8px',
		font: `11.5px ${font['--mono']}`,
		color: color['--muted'],
		marginBottom: { default: '44px', [media.tablet]: '32px' },
	},
	crumbLink: { color: { default: null, ':hover': color['--accent'] } },
	crumbCurrent: { color: color['--ink'] },
	title: {
		fontSize: {
			default: 'clamp(44px, 6.6vw, 84px)',
			[media.phone]: 'clamp(34px, 9.2vw, 52px)',
		},
		letterSpacing: '-.045em',
		lineHeight: 1.02,
		maxWidth: '1100px',
		marginTop: '24px',
	},
	lede: {
		marginTop: '24px',
		fontSize: { default: '18px', [media.phone]: '16px' },
		lineHeight: 1.55,
		maxWidth: { default: '470px', [media.tablet]: '640px' },
	},
	actions: {
		display: 'flex',
		flexWrap: 'wrap',
		alignItems: 'center',
		gap: { default: '16px 24px', [media.phone]: '16px' },
		marginTop: { default: '30px', [media.phone]: '26px' },
	},
	art: {
		// `border-left: 0` once stacked resets the style and colour too.
		borderLeftWidth: { default: '1px', [media.tablet]: 0 },
		borderLeftStyle: { default: 'solid', [media.tablet]: 'none' },
		borderLeftColor: { default: LINE, [media.tablet]: 'currentcolor' },
		borderTopWidth: { default: null, [media.tablet]: '1px' },
		borderTopStyle: { default: null, [media.tablet]: 'solid' },
		borderTopColor: { default: null, [media.tablet]: LINE },
		backgroundColor: color['--field'],
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'center',
		minWidth: 0,
	},
	caption: {
		font: `11px ${font['--mono']}`,
		padding: '15px 24px',
		borderTopWidth: '1px',
		borderTopStyle: 'solid',
		borderTopColor: LINE,
		color: color['--muted'],
	},
})

// The availability line under the title: a square dot and the words.
export const pageStatus = stylex.create({
	root: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '8px',
		marginTop: '22px',
		font: `11px/1.4 ${font['--mono']}`,
		fontSize: { default: null, [media.phone]: '10px' },
		color: color['--muted'],
		padding: '6px 11px',
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: LINE,
		backgroundColor: color['--white'],
		letterSpacing: '0.03em',
	},
	prototype: { color: color['--accent'] },
	dot: { width: '7px', height: '7px', backgroundColor: 'currentColor' },
})

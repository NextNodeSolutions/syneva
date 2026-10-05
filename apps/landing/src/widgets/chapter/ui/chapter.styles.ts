import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font, layout } from '@syneva/design-system/tokens.stylex'

const LINE = color['--line']
const rule = {
	borderTopWidth: '1px',
	borderTopStyle: 'solid',
	borderTopColor: LINE,
}
const stackedRule = {
	borderTopWidth: { default: null, [media.stacked]: '1px' },
	borderTopStyle: { default: null, [media.stacked]: 'solid' },
	borderTopColor: { default: null, [media.stacked]: LINE },
}

// A ruled chapter: copy and drawing side by side, alternating per chapter,
// stacking (copy first) on narrow screens. `sub*` styles are the subpages'
// refinements, layered on the base.
export const chapter = stylex.create({
	section: {
		display: 'grid',
		gridTemplateColumns: {
			default: '1fr 1fr',
			[media.stacked]: 'minmax(0, 1fr)',
		},
		gap: { default: null, [media.stacked]: 0 },
		...rule,
		scrollMarginTop: '24px',
	},
	subSection: {
		gridTemplateColumns: { default: '1fr 1fr', [media.narrow]: '1fr' },
	},
	copy: {
		padding: {
			default: `64px ${layout['--gutter']}`,
			[media.narrow]: `44px ${layout['--gutter']}`,
			[media.phone]: `40px ${layout['--gutter']}`,
		},
		alignSelf: 'center',
	},
	subCopy: {
		minWidth: 0,
		padding: {
			default: `64px ${layout['--gutter']}`,
			[media.narrow]: `40px ${layout['--gutter']}`,
			[media.phone]: `32px ${layout['--gutter']}`,
		},
	},
	reverseCopy: {
		gridColumn: { default: 2, [media.stacked]: 'auto' },
		gridRow: { default: 1, [media.stacked]: 'auto' },
	},
	// A subpage chapter goes to one column from tablets down (subSection), so
	// its swapped placement resets there too, not only once stacked.
	subReverseCopy: {
		gridColumn: { default: 2, [media.narrow]: 'auto' },
		gridRow: { default: 1, [media.narrow]: 'auto' },
	},
	text: { marginTop: '22px', fontSize: '16px', maxWidth: '520px' },
	status: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '8px',
		font: `12px ${font['--mono']}`,
		color: color['--green'],
		'::before': {
			content: "''",
			width: '6px',
			height: '6px',
			backgroundColor: 'currentColor',
		},
	},
	prototype: { color: color['--accent'] },
	list: {
		listStyle: 'none',
		margin: '30px 0',
		padding: 0,
		maxWidth: '520px',
	},
	subList: { marginBottom: 0 },
	item: {
		...rule,
		padding: '15px 0 15px 22px',
		position: 'relative',
		'::before': {
			content: "''",
			position: 'absolute',
			left: 0,
			top: '23px',
			width: '7px',
			height: '7px',
			borderWidth: '1px',
			borderStyle: 'solid',
			borderColor: color['--accent'],
		},
	},
	subItem: { paddingBottom: { default: '15px', ':last-child': 0 } },
	itemHead: { display: 'block', fontSize: '15px', fontWeight: 500 },
	itemText: {
		display: 'block',
		color: color['--muted'],
		fontSize: '14px',
		marginTop: '3px',
	},
	// The honest note under a prototype is a chapter paragraph with room
	// below it.
	note: { marginBottom: '18px' },
	art: {
		borderLeftWidth: { default: '1px', [media.stacked]: 0 },
		borderLeftStyle: { default: 'solid', [media.stacked]: 'none' },
		borderLeftColor: { default: LINE, [media.stacked]: 'currentcolor' },
		...stackedRule,
		display: 'flex',
		flexDirection: 'column',
		justifyContent: 'center',
		minWidth: 0,
		backgroundColor: color['--field'],
	},
	reverseArt: {
		gridColumn: { default: 1, [media.stacked]: 'auto' },
		gridRow: { default: 1, [media.stacked]: 'auto' },
		borderLeftWidth: 0,
		borderLeftStyle: 'none',
		borderLeftColor: 'currentcolor',
		borderRightWidth: { default: '1px', [media.stacked]: 0 },
		borderRightStyle: { default: 'solid', [media.stacked]: 'none' },
		borderRightColor: { default: LINE, [media.stacked]: 'currentcolor' },
		backgroundColor: color['--field-green'],
	},
	// Subpages: a platform ground for every chapter drawing, and the figure
	// stacks under its copy from tablets down.
	subArt: {
		backgroundColor: color['--iso-platform'],
		borderLeftWidth: { default: '1px', [media.narrow]: 0 },
		borderLeftStyle: { default: 'solid', [media.narrow]: 'none' },
		borderLeftColor: { default: LINE, [media.narrow]: 'currentcolor' },
		borderTopWidth: { default: null, [media.narrow]: '1px' },
		borderTopStyle: { default: null, [media.narrow]: 'solid' },
		borderTopColor: { default: null, [media.narrow]: LINE },
	},
	subReverseArt: {
		gridColumn: { default: 1, [media.narrow]: 'auto' },
		gridRow: { default: 1, [media.narrow]: 'auto' },
		borderLeftWidth: 0,
		borderLeftStyle: 'none',
		borderLeftColor: 'currentcolor',
		borderRightWidth: { default: '1px', [media.narrow]: 0 },
		borderRightStyle: { default: 'solid', [media.narrow]: 'none' },
		borderRightColor: { default: LINE, [media.narrow]: 'currentcolor' },
	},
	caption: {
		font: `11px ${font['--mono']}`,
		padding: '15px 24px',
		...rule,
		color: color['--muted'],
	},
	subCaption: {
		lineHeight: 1.6,
		padding: { default: '15px 24px', [media.phone]: '14px 20px' },
	},
})

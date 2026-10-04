import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import {
	color,
	duration,
	ease,
	font,
	layout,
} from '@syneva/design-system/tokens.stylex'

import { indexRowMarker, pagerLinkMarker } from './page-index.stylex'

const rowHover = (): string => stylex.when.ancestor(':hover', indexRowMarker)
const pagerHover = (): string => stylex.when.ancestor(':hover', pagerLinkMarker)
const LINE = color['--line']

// Overview pages list their pages as linked rows: number, icon drawing,
// title and blurb, an optional command, an arrow that steps on hover.
export const indexRows = stylex.create({
	root: {
		borderTopWidth: '1px',
		borderTopStyle: 'solid',
		borderTopColor: color['--line-strong'],
		marginTop: { default: null, ':not(:first-child)': '32px' },
	},
	row: {
		display: 'grid',
		gridTemplateColumns: {
			default: '44px 44px minmax(0, 1fr) auto 28px',
			[media.phone]: '30px minmax(0, 1fr) 20px',
		},
		alignItems: 'center',
		gap: { default: '18px', [media.phone]: '14px' },
		paddingTop: { default: '26px', [media.phone]: '22px' },
		paddingRight: '8px',
		paddingBottom: { default: '26px', [media.phone]: '22px' },
		paddingLeft: { default: 0, ':hover': '12px' },
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: LINE,
		backgroundColor: { default: null, ':hover': 'rgb(255 255 255 / .6)' },
		transition: `background-color ${duration['--duration-medium']} ${ease['--ease-out']}, padding .3s ${ease['--ease-out']}`,
	},
	number: {
		font: `12px ${font['--mono']}`,
		color: color['--accent'],
		display: { default: null, [media.phone]: 'none' },
	},
	icon: {
		width: { default: '30px', [media.phone]: '26px' },
		height: { default: '30px', [media.phone]: '26px' },
		fill: 'none',
		stroke: { default: color['--ink'], [rowHover()]: color['--accent'] },
		strokeWidth: 1.2,
		transform: { default: null, [rowHover()]: 'scale(1.08)' },
		transition: `stroke ${duration['--duration-medium']} ${ease['--ease-out']}, transform .4s ${ease['--ease-spring']}`,
	},
	title: {
		display: 'flex',
		alignItems: 'center',
		gap: '10px',
		fontSize: { default: '21px', [media.phone]: '18px' },
		fontWeight: 500,
		letterSpacing: '-.02em',
	},
	badge: {
		font: `500 10px ${font['--mono']}`,
		fontStyle: 'normal',
		color: color['--accent'],
		backgroundColor: color['--wash'],
		padding: '2px 6px',
		letterSpacing: '.04em',
	},
	blurb: {
		display: 'block',
		color: color['--muted'],
		fontSize: '14.5px',
		marginTop: '4px',
	},
	code: {
		backgroundColor: 'transparent',
		padding: 0,
		color: color['--accent'],
		fontSize: '12.5px',
		whiteSpace: 'nowrap',
		display: { default: null, [media.phone]: 'none' },
	},
	arrow: {
		fontSize: '20px',
		transition: `transform .25s ${ease['--ease-out']}, color ${duration['--duration-medium']}`,
		transform: { default: null, [rowHover()]: 'translateX(4px)' },
		color: { default: null, [rowHover()]: color['--accent'] },
	},
})

// The pager: the previous and next pages of the section, or the way back to
// its overview at either end.
export const pager = stylex.create({
	root: {
		display: 'grid',
		gridTemplateColumns: { default: '1fr 1fr', [media.phone]: '1fr' },
		borderTopWidth: '1px',
		borderTopStyle: 'solid',
		borderTopColor: LINE,
	},
	link: {
		display: 'grid',
		gridTemplateColumns: 'auto 1fr',
		gridTemplateRows: 'auto auto auto',
		columnGap: '14px',
		rowGap: '4px',
		padding: `34px ${layout['--gutter']}`,
		transition: `background-color ${duration['--duration-medium']} ${ease['--ease-out']}`,
		backgroundColor: { default: null, ':hover': color['--white'] },
	},
	next: {
		textAlign: 'right',
		gridTemplateColumns: '1fr auto',
		// `border-left: 0` on phones resets the style and colour too.
		borderLeftWidth: { default: '1px', [media.phone]: 0 },
		borderLeftStyle: { default: 'solid', [media.phone]: 'none' },
		borderLeftColor: { default: LINE, [media.phone]: 'currentcolor' },
		borderTopWidth: { default: null, [media.phone]: '1px' },
		borderTopStyle: { default: null, [media.phone]: 'solid' },
		borderTopColor: { default: null, [media.phone]: LINE },
	},
	direction: {
		gridColumn: '1 / -1',
		font: `11px ${font['--mono']}`,
		color: color['--muted'],
		marginBottom: '8px',
	},
	icon: {
		gridRow: '2 / span 2',
		width: '24px',
		height: '24px',
		fill: 'none',
		stroke: 'currentColor',
		strokeWidth: 1.3,
		marginTop: '3px',
	},
	nextIcon: { gridColumn: 2 },
	title: {
		fontSize: '19px',
		fontWeight: 500,
		letterSpacing: '-.02em',
		color: { default: null, [pagerHover()]: color['--accent'] },
	},
	blurb: { color: color['--muted'], fontSize: '14px' },
	// Without an icon the words take the whole row; on the next side they
	// keep the first column.
	wide: { gridColumn: '1 / -1' },
	nextText: { gridColumn: 1 },
})

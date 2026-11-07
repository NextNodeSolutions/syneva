import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import {
	color,
	duration,
	ease,
	font,
	layout,
} from '@syneva/design-system/tokens.stylex'

import { pagerLinkMarker } from './page-index.stylex'

const pagerHover = (): string => stylex.when.ancestor(':hover', pagerLinkMarker)
const LINE = color['--line']

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
	wide: { gridColumn: '1 / -1' },
	nextText: { gridColumn: 1 },
})

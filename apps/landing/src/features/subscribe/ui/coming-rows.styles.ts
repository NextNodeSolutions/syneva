import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import {
	color,
	duration,
	ease,
	font,
} from '@syneva/design-system/tokens.stylex'

import { comingMarker } from './signup.stylex'

const rowHover = (): string => stylex.when.ancestor(':hover', comingMarker)

// What launch day brings, under the verdict: each page that ships today as a ruled row with its icon.
export const comingRows = stylex.create({
	list: {
		marginTop: '12px',
		marginBottom: 0,
		paddingInline: 0,
		listStyle: 'none',
	},
	row: {
		display: 'grid',
		gridTemplateColumns: '22px minmax(0, 1fr) auto',
		alignItems: 'center',
		columnGap: '14px',
		paddingBlock: { default: '11px', [media.phone]: '12px' },
		borderTopWidth: '1px',
		borderTopStyle: 'solid',
		borderTopColor: color['--line'],
		color: color['--ink'],
	},
	icon: {
		width: '22px',
		height: '22px',
		fill: 'none',
		stroke: color['--accent'],
		strokeWidth: 1.5,
		strokeLinecap: 'round',
		strokeLinejoin: 'round',
	},
	title: {
		display: 'block',
		fontSize: '15px',
		fontWeight: 500,
		lineHeight: 1.35,
		color: { default: color['--ink'], [rowHover()]: color['--accent'] },
		transition: `color ${duration['--duration-fast']} ${ease['--ease-out']}`,
	},
	blurb: {
		display: 'block',
		marginTop: '2px',
		fontSize: '13.5px',
		lineHeight: 1.45,
		color: color['--muted'],
	},
	arrow: {
		font: `16px ${font['--sans']}`,
		color: color['--accent'],
		transition: `transform ${duration['--duration-fast']} ${ease['--ease-out']}`,
		transform: { default: null, [rowHover()]: 'translateX(3px)' },
	},
})

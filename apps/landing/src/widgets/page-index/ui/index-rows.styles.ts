import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import {
	color,
	duration,
	ease,
	font,
} from '@syneva/design-system/tokens.stylex'

import { indexRowMarker } from './page-index.stylex'

const rowHover = (): string => stylex.when.ancestor(':hover', indexRowMarker)
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
		backgroundColor: {
			default: null,
			':hover': `color-mix(in srgb, ${color['--white']} 60%, transparent)`,
		},
		transition: `background-color ${duration['--duration-medium']} ${ease['--ease-out']}, padding ${duration['--duration-shift']} ${ease['--ease-out']}`,
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
		transition: `stroke ${duration['--duration-medium']} ${ease['--ease-out']}, transform ${duration['--duration-spring-medium']} ${ease['--ease-spring']}`,
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
		transition: `transform ${duration['--duration-step']} ${ease['--ease-out']}, color ${duration['--duration-medium']}`,
		transform: { default: null, [rowHover()]: 'translateX(4px)' },
		color: { default: null, [rowHover()]: color['--accent'] },
	},
})

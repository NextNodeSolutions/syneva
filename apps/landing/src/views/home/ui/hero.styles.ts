import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import {
	color,
	duration,
	ease,
	font,
	layout,
} from '@syneva/design-system/tokens.stylex'
import { motionRoot } from '@syneva/motion/root.stylex'

import { heroMarker, newsMarker } from './hero.stylex'

import type { When } from '@syneva/design-system/when'

const lit = (): string => stylex.when.ancestor(':is(.is-lit)', heroMarker)
const newsHover = (): string => stylex.when.ancestor(':hover', newsMarker)
const armed = (): string => stylex.when.ancestor('[data-motion]', motionRoot)

// The intro's hidden poses: the headline sweeps in once the runtime boots
// (see hero.client.ts). Reduced motion and no-JS render the finished pose.
const hidden = <T>(pose: T): When<When<T>> => ({
	default: null,
	[media.motionSafe]: { default: null, [armed()]: pose },
})

const LIGHT =
	"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Cpath d='M24 19v10M19 24h10' stroke='%231888b0' stroke-width='1.2'/%3E%3C/svg%3E\")"

export const hero = stylex.create({
	root: {
		position: 'relative',
		padding: `28px ${layout['--gutter']} 64px`,
		paddingBottom: { default: null, [media.phone]: '44px' },
		isolation: 'isolate',
		overflow: 'hidden',
	},
	field: {
		position: 'absolute',
		inset: 0,
		zIndex: -1,
		pointerEvents: 'none',
		'::before': {
			content: "''",
			position: 'absolute',
			inset: 0,
			backgroundImage: `linear-gradient(${color['--grid']} 1px, transparent 1px), linear-gradient(90deg, ${color['--grid']} 1px, transparent 1px)`,
			backgroundSize: '48px 48px',
			backgroundPosition: `calc(${layout['--gutter']} - 1px) -1px`,
			maskImage:
				'linear-gradient(170deg, #000 0%, rgb(0 0 0 / .55) 38%, transparent 72%)',
		},
	},
	// The pointer light: accent registration crosses wake up around the cursor.
	light: {
		position: 'absolute',
		inset: 0,
		backgroundImage: LIGHT,
		backgroundSize: '48px 48px',
		backgroundPosition: `calc(${layout['--gutter']} - 25px) -25px`,
		opacity: { default: 0, [lit()]: 1 },
		maskImage:
			'radial-gradient(circle 190px at var(--mx, 70%) var(--my, 20%), #000 0%, rgb(0 0 0 / .4) 45%, transparent 100%)',
		transition: `opacity .5s ${ease['--ease-out']}`,
	},
	news: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '12px',
		padding: '5px 12px 5px 5px',
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: { default: color['--line'], ':hover': color['--accent'] },
		backgroundColor: color['--white'],
		fontSize: { default: '13px', [media.phone]: '12px' },
		color: { default: color['--muted'], ':hover': color['--ink'] },
		transition: `border-color ${duration['--duration-medium']} ${ease['--ease-out']}, color ${duration['--duration-medium']} ${ease['--ease-out']}`,
		maxWidth: '100%',
		opacity: hidden(0),
	},
	newsText: {
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	},
	newsTag: {
		font: `500 10.5px ${font['--mono']}`,
		letterSpacing: '.06em',
		textTransform: 'uppercase',
		color: color['--accent'],
		backgroundColor: color['--wash'],
		padding: '3px 7px',
		flexShrink: 0,
	},
	newsArrow: {
		color: color['--ink'],
		transition: `transform ${duration['--duration-medium']} ${ease['--ease-out']}`,
		flexShrink: 0,
		transform: { default: null, [newsHover()]: 'translateX(3px)' },
	},
	title: {
		'--hl-gutter': {
			default: '76px',
			[media.narrow]: '58px',
			[media.phone]: '34px',
		},
		marginTop: '26px',
		fontSize: {
			default: 'clamp(46px, 6.9vw, 94px)',
			[media.phone]: 'clamp(38px, 12.4vw, 56px)',
		},
		letterSpacing: '-.048em',
		lineHeight: { default: 1, [media.phone]: 1.02 },
	},
	line: {
		display: 'grid',
		gridTemplateColumns: 'var(--hl-gutter) minmax(0, auto)',
		alignItems: 'stretch',
		justifyContent: 'start',
	},
	nextLine: { marginTop: '.06em' },
	gutter: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: { default: null, [media.phone]: 'center' },
		gap: { default: '16px', [media.narrow]: '10px', [media.phone]: 0 },
		paddingRight: {
			default: '18px',
			[media.narrow]: '12px',
			[media.phone]: '8px',
		},
		borderRightWidth: '1px',
		borderRightStyle: 'solid',
		borderRightColor: color['--line-strong'],
		font: `400 13px/1 ${font['--mono']}`,
		fontSize: { default: null, [media.narrow]: '11px' },
		letterSpacing: 0,
		color: color['--line-strong'],
		opacity: hidden(0),
	},
	number: {
		fontStyle: 'normal',
		width: '14px',
		textAlign: 'right',
		display: { default: null, [media.phone]: 'none' },
	},
	mark: {
		display: 'grid',
		placeItems: 'center',
		width: { default: '22px', [media.phone]: '18px' },
		height: { default: '22px', [media.phone]: '18px' },
		font: `500 18px/1 ${font['--mono']}`,
		fontSize: { default: null, [media.phone]: '15px' },
		transform: hidden('scale(0)'),
	},
	agentMark: { color: color['--accent'] },
	check: {
		width: { default: '20px', [media.phone]: '16px' },
		height: { default: '20px', [media.phone]: '16px' },
		fill: 'none',
		stroke: color['--green'],
		strokeWidth: 2.4,
		strokeLinecap: 'round',
		strokeLinejoin: 'round',
	},
	clip: {
		position: 'relative',
		display: 'block',
		overflow: 'hidden',
		padding: '.04em .16em .12em',
		paddingInline: { default: null, [media.phone]: '.12em' },
		'::before': {
			content: "''",
			position: 'absolute',
			inset: 0,
			zIndex: -1,
			transformOrigin: 'left',
			transform: hidden('scaleX(0)'),
		},
	},
	agentBand: {
		'::before': {
			backgroundImage: `linear-gradient(90deg, ${color['--wash']}, color-mix(in srgb, ${color['--wash']} 35%, transparent))`,
		},
	},
	humanBand: {
		'::before': {
			backgroundImage: `linear-gradient(90deg, ${color['--mint']}, color-mix(in srgb, ${color['--mint']} 35%, transparent))`,
		},
	},
	text: {
		display: 'block',
		whiteSpace: { default: 'nowrap', [media.phone]: 'normal' },
		transform: hidden('translateY(108%)'),
	},
	decide: {
		position: 'relative',
		fontStyle: 'normal',
		color: color['--green'],
		display: 'inline-block',
	},
	underline: {
		position: 'absolute',
		left: '-2%',
		bottom: '-.08em',
		width: '104%',
		height: '.14em',
		overflow: 'visible',
	},
	underlinePath: {
		fill: 'none',
		stroke: color['--green'],
		strokeWidth: 6,
		strokeLinecap: 'round',
	},
})

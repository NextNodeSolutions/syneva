import { deskText } from '@shared/ui/desk.stylex'
import * as stylex from '@stylexjs/stylex'
import { curves } from '@syneva/design-system/curves.stylex'
import { media } from '@syneva/design-system/media.stylex'
import {
	color,
	duration,
	ease,
	font,
} from '@syneva/design-system/tokens.stylex'

import { brandMarker } from './top-bar.stylex'

const brandHover = (): string => stylex.when.ancestor(':hover', brandMarker)

const pulse = stylex.keyframes({
	'0%': { filter: 'brightness(1.5)' },
	'100%': { filter: 'brightness(1)' },
})

export const topBar = stylex.create({
	bar: {
		position: 'relative',
		display: 'grid',
		gridTemplateColumns: '1fr auto 1fr',
		alignItems: 'center',
		gap: '12px',
		paddingInline: '14px',
		backgroundColor: color['--paper'],
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
		color: color['--muted'],
		fontSize: deskText.body,
	},
	brand: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '10px',
		minWidth: 0,
	},
	home: {
		display: { default: 'none', [media.stacked]: 'inline-flex' },
		alignItems: 'center',
		gap: '8px',
		color: color['--ink'],
		textDecoration: 'none',
		fontSize: '18px',
		fontWeight: 600,
		letterSpacing: '-.05em',
		lineHeight: 1,
		outlineOffset: '4px',
	},
	mark: {
		width: '19px',
		height: '19px',
		flexShrink: 0,
		fill: 'none',
		stroke: 'currentColor',
		strokeWidth: 1.8,
		transition: `transform .6s ${ease['--ease-spring']}`,
		transform: { default: null, [brandHover()]: 'rotate(45deg)' },
	},
	desk: {
		minWidth: 0,
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
		paddingLeft: { default: 0, [media.stacked]: '10px' },
		borderLeftWidth: { default: 0, [media.stacked]: '1px' },
		borderLeftStyle: 'solid',
		borderLeftColor: color['--line'],
		fontFamily: font['--mono'],
		fontSize: deskText.small,
		color: color['--muted'],
	},
	navToggle: {
		display: { default: 'none', [media.tablet]: 'inline-flex' },
		marginLeft: '-6px',
	},
	navToggleHidden: { display: 'none' },
	lenses: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: '8px',
	},
	actions: {
		justifySelf: 'end',
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
	},
	agent: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '7px',
		maxWidth: '280px',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
		fontSize: deskText.small,
		color: color['--accent'],
	},
	agentQueued: { color: color['--amber'] },
	percent: {
		fontFamily: font['--mono'],
		fontSize: deskText.small,
		fontVariantNumeric: 'tabular-nums',
		color: color['--muted'],
		whiteSpace: 'nowrap',
	},
	progress: {
		position: 'absolute',
		insetInline: 0,
		bottom: '-1px',
		height: '2px',
		pointerEvents: 'none',
	},
	progressFill: {
		display: 'block',
		height: '100%',
		width: 0,
		backgroundColor: color['--green'],
		transition: `width .45s ${curves.out}`,
	},
	pulse: {
		animationName: { default: null, [media.motionSafe]: pulse },
		animationDuration: '.8s',
		animationTimingFunction: ease['--ease-out'],
	},
	splitStart: { borderRightWidth: 0 },
	caret: {
		transition: `transform ${duration['--duration-fast']} ${ease['--ease-out']}`,
		transform: 'rotate(90deg)',
	},
	caretOpen: { transform: 'rotate(-90deg)' },
})

export const resetMenu = stylex.create({
	split: { position: 'relative', display: 'inline-flex' },
	backdrop: { position: 'fixed', inset: 0, zIndex: 90 },
	menu: {
		position: 'absolute',
		top: 'calc(100% + 6px)',
		right: 0,
		zIndex: 91,
		minWidth: '230px',
		display: 'flex',
		flexDirection: 'column',
		padding: '4px',
		gap: '2px',
		backgroundColor: color['--white'],
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line-strong'],
		boxShadow: '0 12px 32px rgb(25 27 24 / 14%)',
	},
	item: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'flex-start',
		gap: '2px',
		paddingBlock: '7px',
		paddingInline: '10px',
		borderWidth: 0,
		borderStyle: 'none',
		textAlign: 'left',
		fontFamily: font['--sans'],
		fontSize: deskText.title,
		color: color['--ink'],
		backgroundColor: {
			default: 'transparent',
			':hover': color['--field'],
		},
		cursor: 'pointer',
	},
	itemDanger: {
		color: color['--red'],
		backgroundColor: {
			default: 'transparent',
			':hover': color['--red-tint'],
		},
	},
	hint: {
		fontSize: deskText.small,
		color: color['--muted'],
	},
})

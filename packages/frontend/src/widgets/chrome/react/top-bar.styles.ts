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

// The top bar: the brand on the left, the view lenses in the middle, the
// desk's actions on the right, on the paper chrome under one rule. Review
// progress rides that rule as a green strip.
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
	// The mark and the name, linking back to the hub's dashboard; the mark
	// turns on hover as it does on the public site.
	home: {
		display: 'inline-flex',
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
	// The desk's name (repo, file or ref) after the wordmark, in the mono
	// caption voice.
	desk: {
		minWidth: 0,
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
		paddingLeft: '10px',
		borderLeftWidth: '1px',
		borderLeftStyle: 'solid',
		borderLeftColor: color['--line'],
		fontFamily: font['--mono'],
		fontSize: deskText.small,
		color: color['--muted'],
	},
	// Tablets: the hamburger that opens the file drawer. Hidden on desktop
	// and on a desk without a tree.
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
	// The agent's live line: what it is doing, or that no agent is attached.
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
	// The progress strip covers the bar's rule as the review advances.
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
	// The labelled half of a split button and its caret half share one rule.
	splitStart: { borderRightWidth: 0 },
	caret: {
		transition: `transform ${duration['--duration-fast']} ${ease['--ease-out']}`,
		transform: 'rotate(90deg)',
	},
	caretOpen: { transform: 'rotate(-90deg)' },
})

// The Reset dropdown: hung under the split button, ruled and lifted like
// every floating layer of the desk; a fixed backdrop catches outside clicks.
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

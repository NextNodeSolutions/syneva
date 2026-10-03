import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, ease, font } from '@syneva/design-system/tokens.stylex'

import { menuLinkMarker, navMarker, workflowLinkMarker } from './markers.stylex'
import { menuSpacing } from './menu.stylex'

const LINK_PADDING = menuSpacing.linkPadding
const ICON = menuSpacing.icon
const ICON_GAP = menuSpacing.iconGap
const TITLE_LINE = menuSpacing.titleLine

const keyboard = (): string =>
	stylex.when.ancestor('[data-input="keyboard"]', navMarker)
const linkHover = (): string => stylex.when.ancestor(':hover', menuLinkMarker)
const linkFocus = (): string =>
	stylex.when.ancestor(':focus-visible', menuLinkMarker)
const linkPreviewed = (): string =>
	stylex.when.ancestor(':is(.is-previewed)', menuLinkMarker)
const workflowHover = (): string =>
	stylex.when.ancestor(':hover', workflowLinkMarker)

// Staged rows follow their panel's progress, not a second animation clock.
const rowStagger = {
	'--row-start': {
		default: null,
		[media.motionSafe]: 'calc(var(--menu-order, 0) * 0.035)',
	},
	'--row-progress': {
		default: null,
		[media.motionSafe]:
			'clamp(0, calc((var(--progress, 0) - var(--row-start)) / (1 - var(--row-start))), 1)',
	},
	translate: {
		default: null,
		[media.motionSafe]: '0 calc((1 - var(--row-progress)) * 8px)',
		[media.motionReduced]: 'none',
	},
	opacity: { default: null, [media.motionReduced]: 1 },
}

const currentPage = {
	backgroundColor: {
		default: null,
		':is([aria-current="page"])': color['--paper'],
	},
	boxShadow: {
		default: null,
		':is([aria-current="page"])': `inset 2px 0 0 ${color['--accent']}`,
	},
}

export const menuLink = stylex.create({
	base: {
		display: 'flex',
		alignItems: 'center',
		gap: ICON_GAP,
		padding: LINK_PADDING,
		minHeight: '66px',
		borderRadius: '5px',
		transition: `background-color 150ms ${ease['--ease-out']}, color 150ms ${ease['--ease-out']}`,
		outlineOffset: { default: null, ':focus-visible': '-3px' },
		...currentPage,
		...rowStagger,
	},
	resourceHover: {
		backgroundColor: {
			default: null,
			':is([aria-current="page"])': color['--paper'],
			[media.finePointer]: { default: null, ':hover': color['--paper'] },
		},
	},
	icon: {
		width: ICON,
		height: ICON,
		flexShrink: 0,
		fill: 'none',
		stroke: 'currentColor',
		strokeWidth: 1.4,
		transition: `color 150ms ${ease['--ease-out']}, transform 300ms ${ease['--ease-spring']}`,
		color: {
			default: null,
			[linkPreviewed()]: color['--accent'],
			[media.finePointer]: {
				default: null,
				[linkHover()]: color['--accent'],
			},
		},
		transform: {
			default: null,
			[media.finePointer]: {
				default: null,
				[linkHover()]: 'scale(1.08)',
			},
		},
	},
	text: { minWidth: 0 },
	title: {
		display: 'flex',
		alignItems: 'center',
		gap: '7px',
		fontSize: '14px',
		fontWeight: 500,
		lineHeight: TITLE_LINE,
	},
	blurb: {
		display: 'block',
		marginTop: '4px',
		fontSize: '12px',
		color: color['--muted'],
		lineHeight: 1.5,
	},
	badge: {
		color: color['--accent'],
		backgroundColor: color['--wash'],
		borderRadius: '3px',
		padding: '2px 5px',
		fontSize: '9px',
		fontStyle: 'normal',
		fontWeight: 500,
	},
	arrow: {
		marginLeft: 'auto',
		alignSelf: 'center',
		color: color['--muted'],
		fontSize: '15px',
		opacity: {
			default: 0,
			[linkPreviewed()]: 1,
			[linkFocus()]: 1,
			[media.finePointer]: { default: null, [linkHover()]: 1 },
			[media.compact]: 1,
		},
		transform: {
			default: 'translate(-3px, 3px)',
			[linkPreviewed()]: 'none',
			[linkFocus()]: 'none',
			[media.finePointer]: { default: null, [linkHover()]: 'none' },
			[media.compact]: 'none',
			[media.motionReduced]: 'none',
		},
		transition: `opacity 150ms, transform 150ms ${ease['--ease-out']}`,
		transitionDuration: { default: null, [keyboard()]: '0s !important' },
		transitionDelay: { default: null, [keyboard()]: '0s !important' },
	},
})

export const workflowLink = stylex.create({
	base: {
		position: 'relative',
		display: 'flex',
		flexDirection: 'column',
		padding: LINK_PADDING,
		// Same title-to-blurb step as the menu link blurb.
		gap: '4px',
		borderRadius: '5px',
		outlineOffset: { default: null, ':focus-visible': '-3px' },
		backgroundColor: {
			default: null,
			':is([aria-current="page"])': color['--paper'],
			[media.finePointer]: { default: null, ':hover': color['--paper'] },
		},
		boxShadow: currentPage.boxShadow,
		...rowStagger,
	},
	// The row rule is its own unrounded line: a border-top on the rounded link
	// would curl down at both ends.
	ruled: {
		'::before': {
			content: "''",
			position: 'absolute',
			inset: '0 0 auto',
			borderTopWidth: '1px',
			borderTopStyle: 'solid',
			borderTopColor: color['--line'],
		},
	},
	stackedRule: {
		'::before': {
			content: { default: null, [media.compact]: "''" },
			position: { default: null, [media.compact]: 'absolute' },
			inset: { default: null, [media.compact]: '0 0 auto' },
			borderTopWidth: { default: null, [media.compact]: '1px' },
			borderTopStyle: { default: null, [media.compact]: 'solid' },
			borderTopColor: { default: null, [media.compact]: color['--line'] },
		},
	},
	title: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		gap: ICON_GAP,
		fontSize: '14px',
		fontWeight: 500,
		lineHeight: TITLE_LINE,
	},
	icon: {
		width: ICON,
		height: ICON,
		flexShrink: 0,
		fill: 'none',
		stroke: 'currentColor',
		strokeWidth: 1.4,
		color: {
			default: null,
			[media.finePointer]: {
				default: null,
				[workflowHover()]: color['--accent'],
			},
		},
	},
	arrow: { color: color['--muted'], marginLeft: 'auto' },
	blurb: { fontSize: '12px', lineHeight: 1.5, color: color['--muted'] },
	code: {
		font: `11px/16px ${font['--mono']}`,
		color: color['--accent'],
		marginTop: '4px',
		backgroundColor: 'transparent',
		padding: 0,
	},
})

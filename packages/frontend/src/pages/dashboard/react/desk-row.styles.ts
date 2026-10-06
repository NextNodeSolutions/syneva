import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, duration, ease } from '@syneva/design-system/tokens.stylex'

import { deskGrid, deskRowMarker } from './desk-row.stylex'

const out = ease['--ease-out']
const spring = ease['--ease-spring']
const WHITE_60 = `color-mix(in srgb, ${color['--white']} 60%, transparent)`
// The link inside the row holds keyboard focus.
const FOCUSED = ':has(a:focus-visible)'

const rowHover = (): string => stylex.when.ancestor(':hover', deskRowMarker)
const rowFocus = (): string => stylex.when.ancestor(FOCUSED, deskRowMarker)

// The grid of a row: one line on a wide listing (the desk, its stage, its review, Close, then
// Open as the row's end), two on a narrow one (the review and Close under the desk and the
// stage), stacked on the narrowest. Armed, the pair takes Close's and Open's tracks on a wide
// listing; on the narrowest the warning takes the review's whole line and the actions go
// under it.
const AREAS = {
	wide: '"icon desk stage review actions open"',
	wideArmed: '"icon desk stage review actions actions"',
	tablet: '"icon desk stage open" ". review actions actions"',
	stacked: '"icon desk open" ". stage stage" ". review actions"',
	stackedArmed:
		'"icon desk open" ". stage stage" ". review review" ". actions actions"',
} as const

// The site's index row at app density: the whole row is the link; hovering it (on a fine
// pointer) or focusing its link slides the content in over a white ground (desk-slide.styles.ts:
// the grid itself never changes width), and turns the icon and the arrow petrol. Every hover
// entry is a fine pointer's only: a tap leaves a sticky :hover behind on touch screens, which
// must not half-light the row. The rule under it parts it from the next.
export const deskRow = stylex.create({
	row: {
		position: 'relative',
		display: 'grid',
		alignItems: 'start',
		gridTemplateColumns: {
			default: deskGrid.wide,
			[deskGrid.narrow]: deskGrid.tablet,
			[deskGrid.stackedWidth]: deskGrid.stacked,
		},
		gridTemplateAreas: {
			default: AREAS.wide,
			[deskGrid.narrow]: AREAS.tablet,
			[deskGrid.stackedWidth]: AREAS.stacked,
		},
		columnGap: { default: deskGrid.gap, [deskGrid.stackedWidth]: '14px' },
		rowGap: {
			default: 0,
			[deskGrid.narrow]: '8px',
			[deskGrid.stackedWidth]: '8px',
		},
		paddingBlock: { default: '13px', [media.phone]: '14px' },
		paddingRight: deskGrid.endInset,
		backgroundColor: {
			default: null,
			[FOCUSED]: WHITE_60,
			[media.finePointer]: {
				default: null,
				':hover': WHITE_60,
				[FOCUSED]: WHITE_60,
			},
		},
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
		transition: `background-color ${duration['--duration-medium']} ${out}`,
	},
	armed: {
		gridTemplateAreas: {
			default: AREAS.wideArmed,
			[deskGrid.narrow]: AREAS.tablet,
			[deskGrid.stackedWidth]: AREAS.stackedArmed,
		},
	},
	icon: {
		gridArea: 'icon',
		width: { default: '22px', [media.stacked]: '20px' },
		height: { default: '22px', [media.stacked]: '20px' },
		marginTop: '1px',
		strokeWidth: 1.2,
		color: {
			default: color['--ink'],
			[rowFocus()]: color['--accent'],
			[media.finePointer]: {
				default: color['--ink'],
				[rowHover()]: color['--accent'],
				[rowFocus()]: color['--accent'],
			},
		},
		transform: {
			default: null,
			[rowFocus()]: 'scale(1.08)',
			[media.finePointer]: {
				default: null,
				[rowHover()]: 'scale(1.08)',
				[rowFocus()]: 'scale(1.08)',
			},
		},
		// It slides with the content (desk-slide.styles.ts), on its own clock.
		translate: {
			default: null,
			[rowFocus()]: '10px 0',
			[media.finePointer]: {
				default: null,
				[rowHover()]: '10px 0',
				[rowFocus()]: '10px 0',
			},
		},
		transition: `color ${duration['--duration-medium']} ${out}, transform ${duration['--duration-spring-medium']} ${spring}, translate ${duration['--duration-shift']} ${out}`,
	},
	// The row's end: Open and its arrow, petrol like every way in; the arrow steps forward
	// while the row is hovered or its link focused.
	open: {
		gridArea: 'open',
		justifySelf: 'end',
		display: 'inline-flex',
		alignItems: 'center',
		gap: '6px',
		marginTop: '1px',
		fontSize: '13px',
		fontWeight: 500,
		lineHeight: '20px',
		whiteSpace: 'nowrap',
		color: color['--accent'],
	},
	arrow: {
		width: '16px',
		height: '16px',
		transform: {
			default: null,
			[rowFocus()]: 'translateX(4px)',
			[media.finePointer]: {
				default: null,
				[rowHover()]: 'translateX(4px)',
				[rowFocus()]: 'translateX(4px)',
			},
		},
		transition: `transform ${duration['--duration-step']} ${out}`,
	},
})

const arrive = stylex.keyframes({
	from: { backgroundColor: color['--wash-tint'] },
	to: { backgroundColor: 'transparent' },
})

// A row that was not in the listing before: the wash tint fades out of it once.
export const deskArrival = stylex.create({
	row: {
		animationName: { default: null, [media.motionSafe]: arrive },
		animationDuration: '1600ms',
		animationTimingFunction: out,
	},
})

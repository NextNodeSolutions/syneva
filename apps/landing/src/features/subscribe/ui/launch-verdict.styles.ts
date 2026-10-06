import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'
import { transition } from '@syneva/design-system/transitions.stylex'

export const launchVerdict = stylex.create({
	entry: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		gap: '16px',
		minHeight: '24px',
	},
	value: {
		minWidth: 0,
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
		fontSize: '15px',
		color: color['--ink'],
	},
	email: { fontFamily: font['--mono'], fontSize: '13.5px' },
	tags: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
	caption: {
		flexShrink: 0,
		font: `10.5px ${font['--mono']}`,
		letterSpacing: '.08em',
		textTransform: 'uppercase',
		color: color['--green'],
	},
	top: {
		paddingTop: '22px',
		paddingInline: { default: '20px', [media.phone]: '14px' },
	},
	again: {
		marginTop: '6px',
		fontSize: '13px',
		color: color['--muted'],
	},
	day: {
		paddingTop: '18px',
		paddingBottom: '22px',
		paddingInline: { default: '20px', [media.phone]: '14px' },
	},
	// Takes the focus once the address is in, only so a screen reader reads the verdict: nothing to operate, so no ring.
	heading: { fontSize: '24px', outline: 'none' },
	lede: {
		fontSize: '15px',
		lineHeight: 1.55,
	},
	// A text button set as the site's secondary links are, inline in its sentence.
	reset: {
		fontFamily: 'inherit',
		paddingBlock: 0,
		paddingInline: 0,
		borderWidth: 0,
		borderStyle: 'none',
		borderColor: 'currentcolor',
		backgroundColor: 'transparent',
		cursor: 'pointer',
		transition: `color ${transition.fast}, text-decoration-color ${transition.fast}`,
	},
})

import * as stylex from '@stylexjs/stylex'
import {
	color,
	duration,
	ease,
	font,
} from '@syneva/design-system/tokens.stylex'

// `border: 0` resets the style and colour too, so all three are written.
const noBorder = {
	borderWidth: 0,
	borderStyle: 'none',
	borderColor: 'currentcolor',
} as const

// The site's command box: a prompt, the read-only command and a copy button
// on a white tile; the status line hangs under it, out of flow, so the row
// after it keeps its place whatever it says.
export const commandChip = stylex.create({
	box: {
		position: 'relative',
		display: 'flex',
		alignItems: 'center',
		gap: '12px',
		minWidth: 0,
		maxWidth: '380px',
		paddingTop: '6px',
		paddingRight: '6px',
		paddingBottom: '6px',
		paddingLeft: '16px',
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: {
			default: color['--line-strong'],
			':focus-within': color['--ink'],
		},
		backgroundColor: color['--white'],
		transition: `border-color ${duration['--duration-medium']} ${ease['--ease-out']}`,
	},
	// On a wash band: paper ground, petrol rule. Merging replaces the box's
	// whole border colour, so the focus state is restated.
	onWash: {
		borderColor: {
			default: color['--accent-line'],
			':focus-within': color['--ink'],
		},
		backgroundColor: color['--paper'],
	},
	// Filling its column (a band's install column), level with the rules under it.
	block: { maxWidth: 'none' },
	// Merged last while the copy holds.
	copied: { borderColor: color['--green'] },
	prompt: {
		fontFamily: font['--mono'],
		fontSize: '14px',
		color: color['--accent'],
		userSelect: 'none',
	},
	field: {
		...noBorder,
		flex: '1 1 auto',
		minWidth: 0,
		paddingBlock: '8px',
		paddingInline: 0,
		fontFamily: font['--mono'],
		fontSize: '13.5px',
		color: color['--ink'],
		backgroundColor: 'transparent',
		caretColor: color['--accent'],
		// A command wider than the field shows it is cut; Copy still copies
		// all of it. The box's ink rule marks focus instead of an outline.
		textOverflow: 'ellipsis',
		outlineStyle: { default: null, ':focus-visible': 'none' },
	},
	copy: {
		...noBorder,
		flexShrink: 0,
		display: 'grid',
		placeItems: 'center',
		width: '40px',
		height: '40px',
		paddingBlock: 0,
		paddingInline: 0,
		color: color['--ink'],
		backgroundColor: { default: 'transparent', ':hover': color['--wash'] },
		cursor: 'pointer',
	},
	status: {
		position: 'absolute',
		top: 'calc(100% + 6px)',
		left: 0,
		whiteSpace: 'nowrap',
		pointerEvents: 'none',
		fontFamily: font['--mono'],
		fontSize: '11px',
		color: color['--green'],
	},
	// The manual-copy fallback is guidance, not a verdict: petrol.
	fallback: { color: color['--accent'] },
})

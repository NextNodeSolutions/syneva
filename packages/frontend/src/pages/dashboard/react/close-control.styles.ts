import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color } from '@syneva/design-system/tokens.stylex'

// The actions cell sits above the row's stretched link, so its buttons take their own clicks.
// Its controls are 30px tall (40px on phones, where a thumb presses them) and their labels
// sit on the line beside them: the cell rises by half the excess over that 22px line, less
// the 2px the row's first line sits lower at full width (the desk title's baseline). From
// tablets down the actions end where the arrow does, under it: Close is a text link with no
// inset, held 3px off the edge, where the arrow's drawn tip is (x 16.75 of its 20px box).
export const closeControl = stylex.create({
	// Close at rest is the row's quiet action: muted, its underline drawn only under the
	// pointer, so the row's way in (Open) is the one that reads first.
	quiet: {
		color: { default: color['--muted'], ':hover': color['--red'] },
		textDecorationColor: {
			default: 'transparent',
			':hover': color['--red-line'],
		},
	},
	cell: {
		gridArea: 'actions',
		position: 'relative',
		zIndex: 1,
		display: 'flex',
		gap: '16px',
		justifyContent: 'flex-end',
		alignItems: 'center',
		alignSelf: 'start',
		marginRight: { default: 0, [media.tablet]: '3px' },
		marginTop: {
			default: '-2px',
			[media.tablet]: '-4px',
			[media.stacked]: '-9px',
		},
	},
	// Armed on a phone, the pair has a line of its own under the warning, starting on the text
	// column; with no text line beside it, it does not rise.
	armed: {
		justifyContent: { default: 'flex-end', [media.stacked]: 'flex-start' },
		marginTop: {
			default: '-2px',
			[media.tablet]: '-4px',
			[media.stacked]: 0,
		},
	},
})

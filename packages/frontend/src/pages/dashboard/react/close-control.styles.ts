import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color } from '@syneva/design-system/tokens.stylex'

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
	armed: {
		justifyContent: { default: 'flex-end', [media.stacked]: 'flex-start' },
		marginTop: {
			default: '-2px',
			[media.tablet]: '-4px',
			[media.stacked]: 0,
		},
	},
})

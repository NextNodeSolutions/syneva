import { deskText } from '@shared/ui/desk.stylex'
import * as stylex from '@stylexjs/stylex'
import { color } from '@syneva/design-system/tokens.stylex'

export const domainChips = stylex.create({
	row: { display: 'inline-flex', alignItems: 'center', gap: '8px' },
	title: {
		fontSize: deskText.label,
		color: color['--accent'],
		whiteSpace: 'nowrap',
	},
	// Identifiers in their own case, a size up: lowercase at the caption's size is too small to read.
	identifiers: {
		fontSize: deskText.small,
		textTransform: 'none',
		letterSpacing: 0,
	},
})

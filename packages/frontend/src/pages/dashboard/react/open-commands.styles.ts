import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// The command that opens a desk and its variants, on the page's paper: a white command box,
// then the variants as the site's spec rows under hairlines, each command in ink (text to
// select, not a control).
export const openCommands = stylex.create({
	install: { alignSelf: 'center', minWidth: 0 },
	label: {
		marginBottom: '10px',
		fontFamily: font['--mono'],
		fontSize: '11px',
		color: color['--muted'],
	},
	// Clear of the chip's status line, which hangs under the chip out of flow.
	spec: {
		marginTop: '30px',
		borderTopWidth: '1px',
		borderTopStyle: 'solid',
		borderTopColor: color['--line'],
	},
	specRow: {
		display: 'grid',
		gridTemplateColumns: {
			default: 'minmax(0, 1.25fr) minmax(0, 1fr)',
			[media.phone]: 'minmax(0, 1fr)',
		},
		gap: { default: '16px', [media.phone]: '2px' },
		alignItems: 'baseline',
		paddingBlock: '11px',
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
		fontSize: '13.5px',
		color: color['--muted'],
	},
	specKey: {
		fontFamily: font['--mono'],
		fontSize: '12.5px',
		color: color['--ink'],
		overflowWrap: 'anywhere',
	},
})

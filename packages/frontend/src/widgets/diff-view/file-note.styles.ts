import { deskText } from '@shared/ui/desk.stylex'
import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// The strip standing in for a diff the desk cannot show: a pure rename
// (nothing to show), a file whose contents failed to load, a diff gone stale
// under the review. A static note on a white sheet, not a control: no hover,
// no pointer. The stale one speaks amber, the stale-notice tone.
export const fileNote = stylex.create({
	wrap: { padding: '12px' },
	strip: {
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
		width: '100%',
		paddingBlock: '10px',
		paddingInline: '12px',
		fontFamily: font['--sans'],
		fontSize: deskText.body,
		color: color['--muted'],
		backgroundColor: color['--white'],
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line'],
		cursor: 'default',
	},
	stale: {
		color: color['--amber'],
		backgroundColor: color['--amber-tint'],
		borderColor: color['--amber-line'],
	},
	icon: { color: color['--amber'] },
	name: {
		fontFamily: font['--mono'],
		color: color['--ink'],
	},
	meta: {
		flexGrow: 1,
		textAlign: 'right',
	},
})

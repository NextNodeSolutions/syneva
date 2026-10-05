import { deskText } from '@shared/ui/desk.stylex'
import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// The two transient labels pinned over the workspace's foot: the toast (a
// done thing, in the verdict's green) and the go-to-line register (a mode,
// neutral). Square, ruled, like a tag at reading size.
export const transient = stylex.create({
	pinned: {
		position: 'absolute',
		left: '50%',
		bottom: '46px',
		zIndex: 50,
		transform: 'translateX(-50%)',
		display: 'flex',
		alignItems: 'center',
		gap: '6px',
		paddingBlock: '7px',
		paddingInline: '12px',
		borderWidth: '1px',
		borderStyle: 'solid',
		fontFamily: font['--sans'],
		fontSize: deskText.body,
		whiteSpace: 'nowrap',
		boxShadow: '0 12px 32px rgb(25 27 24 / 14%)',
	},
	hidden: { display: 'none' },
	toast: {
		color: color['--green'],
		backgroundColor: color['--mint'],
		borderColor: color['--green-line'],
	},
	goline: {
		color: color['--ink'],
		backgroundColor: color['--white'],
		borderColor: color['--line-strong'],
	},
	line: {
		fontFamily: font['--mono'],
		fontWeight: 600,
	},
	hint: {
		display: 'flex',
		alignItems: 'center',
		gap: '4px',
		marginLeft: '6px',
		color: color['--muted'],
	},
})

import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// The hub this page belongs to, as a white tile under the top bar: where the hosted
// service's workspace switch will sit, so it already reads as the place you are in.
export const hubIdentity = stylex.create({
	root: {
		display: 'flex',
		alignItems: 'center',
		gap: '11px',
		marginTop: '12px',
		marginInline: '8px',
		paddingBlock: '9px',
		paddingLeft: '16px',
		paddingRight: '10px',
		minHeight: '40px',
		boxSizing: 'border-box',
		backgroundColor: color['--white'],
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line'],
		overflow: 'hidden',
	},
	// Folded to the rail, the tile gives way to its square alone, on the rail's centre line.
	folded: {
		backgroundColor: 'transparent',
		borderColor: 'transparent',
	},
	text: {
		margin: 0,
		minWidth: 0,
		display: 'flex',
		flexDirection: 'column',
		gap: '2px',
	},
	name: { fontSize: '13px', fontWeight: 500, lineHeight: 1.2 },
	where: {
		fontFamily: font['--mono'],
		fontSize: '10.5px',
		color: color['--muted'],
		overflow: 'hidden',
		textOverflow: 'ellipsis',
	},
})

import { deskSize, deskText } from '@shared/ui/desk.stylex'
import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// The position strip: where the reviewer is at every level, each level one step group of a near-constant width, so the steps stay under the pointer whatever is open beside them.
export const guideBar = stylex.create({
	bar: {
		flexShrink: 0,
		display: 'flex',
		alignItems: 'center',
		gap: '6px',
		height: deskSize.subbar,
		paddingInline: '10px',
		// Not clipped: the tips the steps and the brick carry draw below the bar. The brick's name is the one width that moves and it clips inside its own box.
		backgroundColor: color['--paper'],
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
		fontSize: deskText.body,
	},
	group: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '2px',
	},
	label: {
		paddingInline: '4px',
		fontFamily: font['--mono'],
		fontSize: deskText.label,
		letterSpacing: '.06em',
		textTransform: 'uppercase',
		whiteSpace: 'nowrap',
		color: color['--muted'],
	},
	number: { color: color['--ink'] },
	// The brick under the cursor, after the change count: the one label whose width moves, so it comes last. A control (the brick view's toggle) that reads as the label it was: the name clips inside it, so the tip below it is not clipped with it.
	brick: {
		minWidth: 0,
		fontFamily: font['--mono'],
		fontSize: deskText.label,
	},
	brickName: {
		minWidth: 0,
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	},
	rule: {
		width: '1px',
		height: '16px',
		backgroundColor: color['--line'],
	},
	spacer: { flex: '1 1 auto' },
	acts: {
		display: 'flex',
		alignItems: 'center',
		gap: '4px',
	},
	trigger: { position: 'relative' },
	stale: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '6px',
		marginRight: '6px',
		fontSize: deskText.small,
		color: color['--amber'],
	},
})

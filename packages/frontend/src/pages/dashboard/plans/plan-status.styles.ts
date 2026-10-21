import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// A plan's status as a quiet mono tag: a draft waits on you (amber), an approved plan is ready
// to build (green), an implemented one is done (petrol), an archived one steps back (muted).
export const planStatus = stylex.create({
	tag: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '6px',
		fontFamily: font['--mono'],
		fontSize: '11px',
		letterSpacing: '.04em',
		textTransform: 'lowercase',
	},
	dot: {
		width: '6px',
		height: '6px',
		borderRadius: '50%',
		backgroundColor: 'currentColor',
	},
	draft: { color: color['--amber'] },
	approved: { color: color['--green'] },
	implemented: { color: color['--accent'] },
	archived: { color: color['--muted'] },
})

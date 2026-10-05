import { deskText } from '@shared/ui/desk.stylex'
import * as stylex from '@stylexjs/stylex'
import {
	color,
	duration,
	ease,
	font,
} from '@syneva/design-system/tokens.stylex'

const fast = `${duration['--duration-fast']} ${ease['--ease-out']}`

// The desk's full-surface status layers: the refresh notice slotted under the
// top bar (amber: the page is out of date), and the closed-desk cover - a
// card on the public site's ruled grid field, the tab's terminal state.
export const covers = stylex.create({
	notice: {
		gridRow: '2',
		maxWidth: '100vw',
		paddingBlock: '10px',
		paddingInline: '16px',
		backgroundColor: color['--amber-tint'],
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--amber-line'],
		color: color['--ink'],
		fontSize: deskText.body,
	},
	noticeLead: { color: color['--amber'], fontWeight: 600 },
	cover: {
		gridRow: '2 / -1',
		minWidth: 0,
		minHeight: 0,
		overflow: 'auto',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		padding: '32px',
		backgroundColor: color['--paper'],
		backgroundImage: `linear-gradient(${color['--grid']} 1px, transparent 1px), linear-gradient(90deg, ${color['--grid']} 1px, transparent 1px)`,
		backgroundSize: '48px 48px',
		backgroundPosition: '-1px -1px',
	},
	card: {
		maxWidth: '54ch',
		paddingBlock: '22px',
		paddingInline: '26px',
		backgroundColor: color['--white'],
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line-strong'],
		fontSize: deskText.title,
		lineHeight: 1.6,
		color: color['--muted'],
	},
	title: {
		margin: '0 0 8px',
		fontSize: '22px',
		fontWeight: 500,
		letterSpacing: '-.03em',
		lineHeight: 1.15,
		color: color['--ink'],
	},
	paragraph: { margin: '6px 0 0' },
	code: {
		paddingBlock: '1px',
		paddingInline: '5px',
		fontFamily: font['--mono'],
		fontSize: '.92em',
		color: color['--ink'],
		backgroundColor: color['--field'],
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line'],
	},
	// The site's underlined text link.
	link: {
		color: { default: color['--ink'], ':hover': color['--accent'] },
		textDecoration: 'underline',
		textUnderlineOffset: '4px',
		textDecorationColor: {
			default: color['--line-strong'],
			':hover': color['--accent'],
		},
		transition: `color ${fast}, text-decoration-color ${fast}`,
	},
})

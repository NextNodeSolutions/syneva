import * as stylex from '@stylexjs/stylex'
import {
	color,
	duration,
	ease,
	font,
} from '@syneva/design-system/tokens.stylex'

import { deskText } from './desk.stylex'

const fast = `${duration['--duration-fast']} ${ease['--ease-out']}`

// A fill one step toward its rule: the hover of a tinted control.
const deeper = (tint: string, line: string): string =>
	`color-mix(in srgb, ${tint} 72%, ${line})`

// The desk's controls, composed after the design system's recipes:
// [press.control, control.base, control.<tone> | deskControl.<tone>,
// deskControl.<size>]. The design system sizes controls for a page; the desk
// is a working surface, so its controls run a size smaller and add the
// review's own tones: the tinted intents a thread speaks in (ask, request,
// resolve), the verdict pair, and the pressed state of a toggle.
export const deskControl = stylex.create({
	// The top bar's and the dialogs' controls.
	compact: {
		minHeight: '28px',
		paddingBlock: '4px',
		paddingInline: '10px',
		gap: '7px',
		fontSize: deskText.body,
	},
	// Controls inside a row: a header's actions, a thread's buttons.
	mini: {
		minHeight: '22px',
		paddingBlock: '2px',
		paddingInline: '7px',
		gap: '6px',
		fontSize: deskText.small,
	},
	// Icon-only squares at each size.
	iconCompact: { width: '28px', paddingInline: 0 },
	iconMini: { width: '22px', paddingInline: 0 },
	// A question to the agent, and every toggle that is on: petrol on its wash.
	ask: {
		color: color['--accent'],
		backgroundColor: {
			default: color['--wash'],
			':hover': deeper(color['--wash'], color['--accent-line']),
		},
		borderColor: {
			default: color['--accent-line'],
			':hover': color['--accent'],
		},
	},
	// A change the reviewer asks for.
	request: {
		color: color['--amber'],
		backgroundColor: {
			default: color['--amber-tint'],
			':hover': deeper(color['--amber-tint'], color['--amber-line']),
		},
		borderColor: {
			default: color['--amber-line'],
			':hover': color['--amber'],
		},
	},
	// A thread settled, a file signed off with objections answered.
	resolve: {
		color: color['--green'],
		backgroundColor: {
			default: color['--mint'],
			':hover': deeper(color['--mint'], color['--green-line']),
		},
		borderColor: {
			default: color['--green-line'],
			':hover': color['--green'],
		},
	},
	// A quiet action that destroys something: it reads plain until hovered,
	// then shows what it costs.
	dangerHint: {
		color: { default: color['--muted'], ':hover': color['--red'] },
		backgroundColor: {
			default: 'transparent',
			':hover': color['--red-tint'],
		},
		borderColor: {
			default: 'transparent',
			':hover': color['--red-line'],
		},
	},
	// The same, on a tiled control (Reset, a split button's halves).
	dangerHintTiled: {
		color: { default: color['--ink'], ':hover': color['--red'] },
		backgroundColor: {
			default: color['--white'],
			':hover': color['--red-tint'],
		},
		borderColor: {
			default: color['--line-strong'],
			':hover': color['--red-line'],
		},
	},
	// Keep / Approve: the verdict, the desk's only solid green.
	keep: {
		color: color['--white'],
		backgroundColor: {
			default: color['--green'],
			':hover': `color-mix(in srgb, ${color['--green']} 84%, ${color['--ink']})`,
		},
		borderColor: 'transparent',
	},
	// Undo: the other verdict, a plain tile - removing a change is not a
	// warning, it is a decision.
	undo: {
		color: color['--ink'],
		backgroundColor: {
			default: color['--white'],
			':hover': color['--field'],
		},
		borderColor: {
			default: color['--line-strong'],
			':hover': color['--muted'],
		},
	},
	// Mark reviewed (a file with open objections) and its undo: amber, tinted.
	caution: {
		color: color['--amber'],
		backgroundColor: {
			default: color['--amber-tint'],
			':hover': deeper(color['--amber-tint'], color['--amber-line']),
		},
		borderColor: color['--amber-line'],
	},
})

// A segmented register: two or three exclusive choices in one ruled tile
// (Split / Stacked, Rendered / Source, a lens). The chosen one sits on the
// petrol wash.
export const segmented = stylex.create({
	group: {
		display: 'inline-flex',
		alignItems: 'stretch',
		flexShrink: 0,
		gap: '2px',
		padding: '2px',
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line'],
		backgroundColor: color['--white'],
	},
	item: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '6px',
		minHeight: '22px',
		paddingInline: '8px',
		borderWidth: 0,
		borderStyle: 'none',
		fontFamily: font['--sans'],
		fontSize: deskText.small,
		fontWeight: 500,
		lineHeight: 1,
		whiteSpace: 'nowrap',
		color: { default: color['--muted'], ':hover': color['--ink'] },
		backgroundColor: {
			default: 'transparent',
			':hover': color['--field'],
		},
		cursor: { default: 'pointer', ':disabled': 'default' },
		opacity: { default: null, ':disabled': 0.45 },
		outlineOffset: '1px',
		transition: `color ${fast}, background-color ${fast}`,
	},
	// Inside a dense header the register shrinks a step.
	itemSmall: {
		minHeight: '18px',
		paddingInline: '6px',
		fontSize: deskText.label,
	},
	on: {
		color: { default: color['--accent'], ':hover': color['--accent'] },
		backgroundColor: {
			default: color['--wash'],
			':hover': color['--wash'],
		},
	},
})

// Underlined tabs (Tree / Walkthrough, Settings / Shortcuts): the chosen tab
// is ruled in petrol under its label, on the strip's own bottom rule.
export const tabs = stylex.create({
	strip: {
		display: 'flex',
		alignItems: 'stretch',
		gap: '4px',
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line'],
	},
	tab: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '6px',
		marginBottom: '-1px',
		paddingInline: '8px',
		borderWidth: 0,
		borderStyle: 'solid',
		borderBottomWidth: '2px',
		borderBottomColor: 'transparent',
		backgroundColor: 'transparent',
		fontFamily: font['--sans'],
		fontSize: deskText.body,
		fontWeight: 500,
		color: { default: color['--muted'], ':hover': color['--ink'] },
		cursor: 'pointer',
		transition: `color ${fast}, border-color ${fast}`,
	},
	on: {
		color: { default: color['--ink'], ':hover': color['--ink'] },
		borderBottomColor: color['--accent'],
	},
})

// A count riding a control (open notes, open file threads): mono figures on
// the petrol wash, square like every tag.
export const count = stylex.create({
	base: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'center',
		minWidth: '16px',
		height: '16px',
		paddingInline: '4px',
		fontFamily: font['--mono'],
		fontSize: deskText.label,
		fontWeight: 500,
		fontVariantNumeric: 'tabular-nums',
		lineHeight: 1,
		color: color['--accent'],
		backgroundColor: color['--wash'],
	},
	// Pinned to an icon button's corner.
	corner: {
		position: 'absolute',
		top: '-6px',
		right: '-6px',
		color: color['--white'],
		backgroundColor: color['--accent'],
	},
})

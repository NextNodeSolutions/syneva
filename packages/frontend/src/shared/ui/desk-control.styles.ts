import * as stylex from '@stylexjs/stylex'
import {
	color,
	duration,
	ease,
	font,
} from '@syneva/design-system/tokens.stylex'

import { deskText } from './desk.stylex'

const fast = `${duration['--duration-fast']} ${ease['--ease-out']}`

const deeper = (tint: string, line: string): string =>
	`color-mix(in srgb, ${tint} 72%, ${line})`

export const deskControl = stylex.create({
	compact: {
		minHeight: '28px',
		paddingBlock: '4px',
		paddingInline: '10px',
		gap: '7px',
		fontSize: deskText.body,
	},
	mini: {
		minHeight: '22px',
		paddingBlock: '2px',
		paddingInline: '7px',
		gap: '6px',
		fontSize: deskText.small,
	},
	iconCompact: { width: '28px', paddingInline: 0 },
	iconMini: { width: '22px', paddingInline: 0 },
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
	keep: {
		color: color['--white'],
		backgroundColor: {
			default: color['--green'],
			':hover': `color-mix(in srgb, ${color['--green']} 84%, ${color['--ink']})`,
		},
		borderColor: 'transparent',
	},
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
	caution: {
		color: color['--amber'],
		backgroundColor: {
			default: color['--amber-tint'],
			':hover': deeper(color['--amber-tint'], color['--amber-line']),
		},
		borderColor: color['--amber-line'],
	},
})

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
	corner: {
		position: 'absolute',
		top: '-6px',
		right: '-6px',
		color: color['--white'],
		backgroundColor: color['--accent'],
	},
})

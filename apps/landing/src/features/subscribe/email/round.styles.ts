import { hexColor } from '@syneva/design-system/tokens.stylex'

import { caption, EMAIL_FONT } from './email.styles'

import type { CSSProperties } from 'react'

const cell: CSSProperties = { padding: 0 }

// One review round drawn as the hero's desk draws it: a file header with its verdict, the lines on their bands, the question asked on them and the agent's answer.
export const round = {
	frame: {
		width: '100%',
		borderCollapse: 'separate',
		border: `1px solid ${hexColor.lineStrong}`,
		backgroundColor: hexColor.white,
	},
	bar: {
		padding: '10px 14px',
		borderBottom: `1px solid ${hexColor.line}`,
		backgroundColor: hexColor.paper,
	},
	barCaption: { ...caption, fontSize: '10.5px', color: hexColor.ink },
	barAside: { ...caption, fontSize: '10.5px', textAlign: 'right' },
	square: {
		display: 'inline-block',
		width: '7px',
		height: '7px',
		marginRight: '9px',
		backgroundColor: hexColor.accent,
	},
	file: {
		padding: '11px 14px',
		borderBottom: `1px solid ${hexColor.line}`,
		fontFamily: EMAIL_FONT.mono,
		fontSize: '13px',
		lineHeight: '18px',
		fontWeight: 600,
		color: hexColor.ink,
	},
	stat: { paddingLeft: '10px', fontWeight: 400, color: hexColor.muted },
	verdicts: {
		padding: '9px 14px',
		borderBottom: `1px solid ${hexColor.line}`,
		textAlign: 'right',
		whiteSpace: 'nowrap',
	},
	rejectBox: {
		display: 'inline-block',
		width: '26px',
		marginLeft: '6px',
		border: `1px solid ${hexColor.lineStrong}`,
		fontFamily: EMAIL_FONT.sans,
		fontSize: '12px',
		lineHeight: '18px',
		textAlign: 'center',
		color: hexColor.muted,
	},
	acceptBox: {
		display: 'inline-block',
		width: '26px',
		marginLeft: '6px',
		border: `1px solid ${hexColor.greenLine}`,
		backgroundColor: hexColor.mint,
		fontFamily: EMAIL_FONT.sans,
		fontSize: '12px',
		lineHeight: '18px',
		textAlign: 'center',
		color: hexColor.green,
	},
	lines: { width: '100%', borderCollapse: 'collapse' },
	number: {
		...cell,
		width: '34px',
		paddingRight: '8px',
		textAlign: 'right',
		fontFamily: EMAIL_FONT.mono,
		fontSize: '12px',
		lineHeight: '24px',
		color: hexColor.lineStrong,
	},
	sign: {
		...cell,
		width: '18px',
		fontFamily: EMAIL_FONT.mono,
		fontSize: '13px',
		lineHeight: '24px',
	},
	code: {
		...cell,
		paddingRight: '14px',
		fontFamily: EMAIL_FONT.mono,
		fontSize: '13px',
		lineHeight: '24px',
		color: hexColor.ink,
		whiteSpace: 'nowrap',
	},
	// A line's band (every cell of it) and its ink (the sign and the code).
	removedBand: { backgroundColor: hexColor.wash },
	removedInk: { color: hexColor.accent },
	struck: { textDecoration: 'line-through' },
	addedBand: { backgroundColor: hexColor.mintTint },
	addedInk: { color: hexColor.green },
	thread: { padding: '6px 14px 14px' },
	ask: {
		padding: '10px 14px 12px',
		borderLeft: `2px solid ${hexColor.accent}`,
		backgroundColor: hexColor.washTint,
	},
	who: { ...caption, fontSize: '10px', lineHeight: '15px' },
	agentWho: { color: hexColor.accent, paddingTop: '9px' },
	message: {
		margin: '2px 0 0',
		fontFamily: EMAIL_FONT.sans,
		fontSize: '14px',
		lineHeight: '20px',
		color: hexColor.ink,
	},
} satisfies Record<string, CSSProperties>

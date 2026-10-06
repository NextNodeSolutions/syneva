import { hexColor } from '@syneva/design-system/tokens.stylex'

import { EMAIL_FONT } from './email.styles'

import type { CSSProperties } from 'react'

// The hero's two-line diff: a mono gutter, then the line on its band.
export const diff = {
	table: { width: '100%', borderCollapse: 'collapse' },
	gutter: {
		width: '52px',
		padding: '0 12px 0 0',
		borderRight: `1px solid ${hexColor.lineStrong}`,
		fontFamily: EMAIL_FONT.mono,
		fontSize: '12px',
		lineHeight: '20px',
		color: hexColor.lineStrong,
		whiteSpace: 'nowrap',
		verticalAlign: 'middle',
	},
	number: { display: 'inline-block', width: '16px', textAlign: 'right' },
	added: { paddingLeft: '12px', color: hexColor.accent, fontWeight: 600 },
	checked: { paddingLeft: '12px', color: hexColor.green, fontWeight: 600 },
	line: {
		padding: '9px 14px 11px',
		fontFamily: EMAIL_FONT.sans,
		fontSize: '25px',
		lineHeight: '31px',
		fontWeight: 500,
		letterSpacing: '-.03em',
		color: hexColor.ink,
	},
	agentBand: { backgroundColor: hexColor.wash },
	humanBand: { backgroundColor: hexColor.mint },
	spacer: { height: '4px', padding: 0, fontSize: 0, lineHeight: 0 },
	// The hero's green "decide", underlined.
	decided: {
		color: hexColor.green,
		borderBottom: `2px solid ${hexColor.green}`,
	},
} satisfies Record<string, CSSProperties>

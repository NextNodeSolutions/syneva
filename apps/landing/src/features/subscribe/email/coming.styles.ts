import { hexColor } from '@syneva/design-system/tokens.stylex'

import { EMAIL_FONT } from './email.styles'

import type { CSSProperties } from 'react'

// The site's numbered, ruled rows: a petrol index on each rule, the title, its line, the arrow.
export const coming = {
	table: { width: '100%', borderCollapse: 'collapse', marginTop: '12px' },
	row: { borderTop: `1px solid ${hexColor.line}` },
	indexCell: {
		width: '34px',
		padding: '14px 0 0',
		verticalAlign: 'top',
		fontFamily: EMAIL_FONT.mono,
		fontSize: '12px',
		lineHeight: '20px',
		color: hexColor.accent,
	},
	textCell: { padding: '12px 0 13px' },
	title: {
		fontFamily: EMAIL_FONT.sans,
		fontSize: '16px',
		lineHeight: '22px',
		fontWeight: 500,
		color: hexColor.ink,
		textDecoration: 'none',
	},
	blurb: {
		margin: '2px 0 0',
		fontFamily: EMAIL_FONT.sans,
		fontSize: '14px',
		lineHeight: '20px',
		color: hexColor.muted,
	},
	arrowCell: {
		width: '24px',
		padding: '13px 0 0',
		verticalAlign: 'top',
		textAlign: 'right',
	},
	arrow: {
		fontFamily: EMAIL_FONT.sans,
		fontSize: '16px',
		lineHeight: '22px',
		color: hexColor.accent,
		textDecoration: 'none',
	},
} satisfies Record<string, CSSProperties>

// The home's principles strip, two by two under one strong rule.
export const principles = {
	table: {
		width: '100%',
		borderCollapse: 'collapse',
		borderTop: `1px solid ${hexColor.lineStrong}`,
		backgroundColor: hexColor.paper,
	},
	cell: {
		width: '50%',
		padding: '13px 0 13px 32px',
		fontFamily: EMAIL_FONT.mono,
		fontSize: '12px',
		lineHeight: '18px',
		color: hexColor.ink,
		verticalAlign: 'top',
	},
	index: { paddingRight: '10px', color: hexColor.accent },
} satisfies Record<string, CSSProperties>

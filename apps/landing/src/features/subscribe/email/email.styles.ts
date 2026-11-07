import { hexColor } from '@syneva/design-system/tokens.stylex'

import type { CSSProperties } from 'react'

// An email is styled inline, in hex: no client reads a stylesheet's classes reliably or resolves a custom property. The colours are the design system's own (hexColor); the type falls back through the faces mail clients carry, since only some load Geist.
export const EMAIL_FONT = {
	sans: "Geist, -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
	mono: "'Geist Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
} as const

const EMAIL_WIDTH = 560

// The site's mono caption: uppercase, tracked out.
export const caption: CSSProperties = {
	margin: 0,
	fontFamily: EMAIL_FONT.mono,
	fontSize: '11px',
	lineHeight: '16px',
	letterSpacing: '.08em',
	textTransform: 'uppercase',
	color: hexColor.muted,
}

export const email = {
	body: {
		margin: 0,
		padding: '40px 12px',
		backgroundColor: hexColor.paper,
		fontFamily: EMAIL_FONT.sans,
		color: hexColor.ink,
	},
	container: {
		width: '100%',
		maxWidth: `${EMAIL_WIDTH}px`,
		margin: '0 auto',
	},
	header: { paddingBottom: '18px' },
	logo: { display: 'block', border: 0 },
	headerCaption: { ...caption, textAlign: 'right' },
	card: {
		backgroundColor: hexColor.white,
		border: `1px solid ${hexColor.lineStrong}`,
	},
	headline: { padding: '32px 32px 26px' },
	paragraph: {
		margin: '0 0 26px',
		padding: '0 32px',
		fontFamily: EMAIL_FONT.sans,
		fontSize: '15px',
		lineHeight: '24px',
		color: hexColor.muted,
	},
	section: { padding: '0 32px 30px' },
	footer: { padding: '22px 4px 0' },
	footerText: {
		margin: '0 0 10px',
		fontFamily: EMAIL_FONT.mono,
		fontSize: '11.5px',
		lineHeight: '19px',
		color: hexColor.muted,
	},
	footerLink: { color: hexColor.ink, textDecoration: 'underline' },
} satisfies Record<string, CSSProperties>

import { deskText } from '@shared/ui/desk.stylex'
import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// The desk's dialogs (confirm, send, settings): a white sheet under a strong
// rule, lifted over a paper veil - the light field stays visible behind, as
// the public site never darkens a page. Square, like every surface.
export const modal = stylex.create({
	backdrop: {
		position: 'fixed',
		inset: 0,
		zIndex: 80,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		padding: '24px',
		backgroundColor: `color-mix(in srgb, ${color['--paper']} 74%, transparent)`,
	},
	sheet: {
		width: '420px',
		maxWidth: '100%',
		padding: '20px',
		backgroundColor: color['--white'],
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line-strong'],
		boxShadow: '0 24px 64px rgb(25 27 24 / 16%)',
		fontFamily: font['--sans'],
		color: color['--ink'],
	},
	confirm: { width: '380px' },
	settings: {
		width: '600px',
		maxHeight: '84vh',
		overflow: 'auto',
		paddingTop: '6px',
	},
	message: {
		margin: 0,
		fontSize: deskText.title,
		lineHeight: 1.55,
		color: color['--ink'],
	},
	actions: {
		display: 'flex',
		justifyContent: 'flex-end',
		gap: '8px',
		marginTop: '18px',
	},
	// The Send dialog's overall note: the design system's field, at the
	// desk's size.
	note: {
		minHeight: '88px',
		marginTop: '14px',
		fontSize: deskText.title,
		resize: 'vertical',
	},
})

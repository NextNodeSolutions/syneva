import { deskText } from '@shared/ui/desk.stylex'
import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// The oversized-file card that stands in for a diff too large to render: a
// white sheet under one rule, centred in the diff pane. The change kind tints
// the icon and the kind label only (change-kind.styles.ts); the byte size is
// its focal figure, and its last row carries the same verdict a rendered
// file's header does, with "Load diff anyway" pushed to the right.
export const oversized = stylex.create({
	card: {
		maxWidth: '620px',
		marginBlock: '40px',
		marginInline: 'auto',
		paddingBlock: '20px',
		paddingInline: '22px',
		backgroundColor: color['--white'],
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line'],
		fontFamily: font['--sans'],
		fontSize: deskText.body,
		color: color['--ink'],
	},
	head: {
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
	},
	path: {
		minWidth: 0,
		fontFamily: font['--mono'],
		fontSize: deskText.title,
		fontWeight: 600,
		color: color['--ink'],
		wordBreak: 'break-all',
	},
	moved: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '3px',
		fontFamily: font['--mono'],
		fontSize: deskText.label,
		color: color['--amber'],
	},
	kind: {
		marginLeft: 'auto',
		flexShrink: 0,
		fontSize: deskText.label,
	},
	badges: {
		display: 'flex',
		flexWrap: 'wrap',
		alignItems: 'center',
		gap: '10px',
		marginTop: '13px',
	},
	category: {
		fontSize: deskText.label,
		color: color['--accent'],
	},
	stats: {
		display: 'flex',
		alignItems: 'baseline',
		gap: '14px',
		marginTop: '16px',
	},
	size: {
		fontFamily: font['--mono'],
		fontSize: deskText.display,
		fontWeight: 600,
		color: color['--ink'],
	},
	counts: { fontSize: deskText.title },
	note: {
		marginTop: '10px',
		marginBottom: 0,
		marginInline: 0,
		fontSize: deskText.body,
		lineHeight: 1.5,
		color: color['--muted'],
	},
	// The whole-file comment section, when the card hosts one.
	actions: {
		display: 'flex',
		alignItems: 'center',
		gap: '10px',
		marginTop: '18px',
		paddingTop: '16px',
		borderTopWidth: '1px',
		borderTopStyle: 'solid',
		borderTopColor: color['--line'],
	},
	verdict: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '8px',
	},
	load: { marginLeft: 'auto' },
})

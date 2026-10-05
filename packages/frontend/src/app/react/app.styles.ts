import { deskSize, deskText, deskVars } from '@shared/ui/desk.stylex'
import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

const TREE = `${deskVars['--left-width']} 1px`
const DIFF = 'minmax(0, 1fr)'
const NOTES = deskVars['--notes-width']

// The workspace grid's columns: the tree and its resizer when the desk has a
// tree (more than one file, not a single-file desk), the diff, and the notes
// ledger when it is open. On tablets the tree and the notes leave the flow as
// drawers, so the diff keeps the whole row.
const columns = (template: string): { gridTemplateColumns: object } => ({
	gridTemplateColumns: { default: template, [media.tablet]: DIFF },
})

export const app = stylex.create({
	// The desk fills the viewport and never scrolls as a page: every column
	// scrolls on its own.
	root: {
		height: '100%',
		display: 'grid',
		gridTemplateRows: `${deskSize.topbar} minmax(0, 1fr)`,
		backgroundColor: color['--paper'],
		color: color['--ink'],
		fontFamily: font['--sans'],
		fontSize: deskText.body,
		lineHeight: 1.5,
		WebkitFontSmoothing: 'antialiased',
	},
	// A restarted desk slots its notice between the top bar and the workspace.
	refreshRequired: {
		gridTemplateRows: `minmax(${deskSize.topbar}, max-content) auto minmax(0, 1fr)`,
	},
	main: {
		position: 'relative',
		minHeight: 0,
		display: 'grid',
		gridRow: '-2',
	},
	withTree: columns(`${TREE} ${DIFF}`),
	treeless: columns(DIFF),
	withTreeAndNotes: columns(`${TREE} ${DIFF} ${NOTES}`),
	treelessWithNotes: columns(`${DIFF} ${NOTES}`),
	center: {
		minWidth: 0,
		minHeight: 0,
		display: 'flex',
		flexDirection: 'column',
		overflow: 'hidden',
		backgroundColor: color['--white'],
	},
	// The veil behind an open drawer: tablets only, tap to close.
	backdrop: {
		display: 'none',
	},
	backdropOpen: {
		display: { default: 'none', [media.tablet]: 'block' },
		position: 'fixed',
		inset: `${deskSize.topbar} 0 0 0`,
		zIndex: 29,
		// A paper veil, as behind a dialog: the light field stays visible.
		backgroundColor: `color-mix(in srgb, ${color['--paper']} 70%, transparent)`,
	},
})

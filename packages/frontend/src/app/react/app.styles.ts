import { deskSize, deskText, deskVars } from '@shared/ui/desk.stylex'
import { shell } from '@shared/ui/shell.stylex'
import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

const TREE = `${deskVars['--left-width']} 1px`
const DIFF = 'minmax(0, 1fr)'
const NOTES = deskVars['--notes-width']

const columns = (template: string): { gridTemplateColumns: object } => ({
	gridTemplateColumns: { default: template, [media.tablet]: DIFF },
})

export const app = stylex.create({
	frame: {
		height: '100%',
		display: 'grid',
		gridTemplateColumns: {
			default: `${shell.railWidth} minmax(0, 1fr)`,
			[media.stacked]: 'minmax(0, 1fr)',
		},
	},
	// The rail's placeholder while its code loads: the folded rail's own rules (its right edge, the top bar's bottom rule level with the desk's), so nothing redraws when it lands.
	railSpace: {
		display: { default: 'block', [media.stacked]: 'none' },
		backgroundColor: color['--paper'],
		backgroundImage: `linear-gradient(${color['--line']}, ${color['--line']})`,
		backgroundSize: '100% 1px',
		backgroundPosition: `0 calc(${shell.barHeight} - 1px)`,
		backgroundRepeat: 'no-repeat',
		borderRightWidth: '1px',
		borderRightStyle: 'solid',
		borderRightColor: color['--line'],
	},
	// The desk fills the viewport and never scrolls as a page: every column scrolls on its own.
	root: {
		height: '100%',
		minWidth: 0,
		display: 'grid',
		gridTemplateRows: `${deskSize.topbar} minmax(0, 1fr)`,
		backgroundColor: color['--paper'],
		color: color['--ink'],
		fontFamily: font['--sans'],
		fontSize: deskText.body,
		lineHeight: 1.5,
		WebkitFontSmoothing: 'antialiased',
	},
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
	backdrop: {
		display: 'none',
	},
	backdropOpen: {
		display: { default: 'none', [media.tablet]: 'block' },
		position: 'fixed',
		inset: `${deskSize.topbar} 0 0 0`,
		zIndex: 29,
		backgroundColor: `color-mix(in srgb, ${color['--paper']} 70%, transparent)`,
	},
})

import { deskText } from '@shared/ui/desk.stylex'
import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// The guided review's Overview page: the public site's ruled grid field as
// its ground, one white card under a strong rule set near the top, its
// headline in the site's heading voice and Start review as the page's one
// petrol action.
export const overview = stylex.create({
	page: {
		minHeight: '100%',
		display: 'grid',
		alignItems: 'start',
		justifyItems: 'center',
		paddingBlock: '48px',
		paddingInline: '30px',
		backgroundColor: color['--paper'],
		backgroundImage: `linear-gradient(${color['--grid']} 1px, transparent 1px), linear-gradient(90deg, ${color['--grid']} 1px, transparent 1px)`,
		backgroundSize: '48px 48px',
	},
	card: {
		width: 'min(680px, 100%)',
		paddingBlock: '24px',
		paddingInline: '28px',
		backgroundColor: color['--white'],
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line-strong'],
	},
	title: {
		marginTop: 0,
		marginInline: 0,
		marginBottom: '6px',
		fontFamily: font['--sans'],
		fontSize: '26px',
		fontWeight: 500,
		letterSpacing: '-.035em',
		lineHeight: 1.1,
		color: color['--ink'],
	},
	sub: { marginBottom: '18px' },
	// The grouping predates the diff: an amber notice, the stale-notice tone.
	stale: {
		marginTop: '12px',
		marginBottom: '18px',
		paddingBlock: '8px',
		paddingInline: '11px',
		backgroundColor: color['--amber-tint'],
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--amber-line'],
		fontSize: deskText.body,
		lineHeight: 1.45,
		color: color['--amber'],
	},
	staleCode: {
		paddingInline: '4px',
		fontFamily: font['--mono'],
		backgroundColor: color['--white'],
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line'],
	},
	actions: {
		display: 'flex',
		alignItems: 'center',
		gap: '12px',
	},
})

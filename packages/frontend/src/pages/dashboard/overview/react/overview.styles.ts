import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'
import { transition } from '@syneva/design-system/transitions.stylex'

// The overview's body under its head and display: the ledger with the journal beside it when
// the page is wide enough for both, under it otherwise. The page is the `page` container its
// columns read.
const SIDE_BY_SIDE = '@container page (min-width: 1040px)'
const PHONE = media.stacked

export const overview = stylex.create({
	page: {
		containerType: 'inline-size',
		containerName: 'page',
		minHeight: '100%',
	},
	// A wrapper that only scopes an entrance: it takes no box, so the page lays out as without it.
	part: { display: 'contents' },
	split: {
		display: 'grid',
		gridTemplateColumns: {
			default: 'minmax(0, 1fr)',
			[SIDE_BY_SIDE]: 'minmax(0, 1fr) 300px',
		},
	},
	list: {
		minWidth: 0,
		paddingInline: { default: '32px', [PHONE]: '16px' },
		paddingBottom: '48px',
	},
	journal: {
		minWidth: 0,
		paddingTop: '22px',
		paddingBottom: '40px',
		paddingInline: { default: '24px', [PHONE]: '16px' },
		borderLeftWidth: { default: 0, [SIDE_BY_SIDE]: '1px' },
		borderLeftStyle: 'solid',
		borderLeftColor: color['--line'],
		borderTopWidth: { default: '1px', [SIDE_BY_SIDE]: 0 },
		borderTopStyle: 'solid',
		borderTopColor: color['--line'],
	},
	journalHead: {
		display: 'flex',
		alignItems: 'baseline',
		justifyContent: 'space-between',
		paddingBottom: '8px',
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: color['--line-strong'],
	},
	journalTitle: {
		fontFamily: font['--mono'],
		fontSize: '10.5px',
		letterSpacing: '.08em',
		textTransform: 'uppercase',
		color: color['--muted'],
	},
	journalLink: {
		fontSize: '12px',
		color: { default: color['--muted'], ':hover': color['--accent'] },
		textDecoration: 'underline',
		textUnderlineOffset: '3px',
		transition: `color ${transition.fast}`,
	},
})

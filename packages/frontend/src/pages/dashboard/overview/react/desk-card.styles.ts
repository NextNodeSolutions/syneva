import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'
import { transition } from '@syneva/design-system/transitions.stylex'

import { cardLinkMarker, deskCardMarker } from './desk-card.stylex'

const cardHover = (): string => stylex.when.ancestor(':hover', deskCardMarker)
const linkFocus = (): string =>
	stylex.when.ancestor(':focus-visible', cardLinkMarker)

// A desk as a card on the board: a white tile under a hairline, the whole card its link. Its
// title first, then what it reviews, the agent's words when it has some, the review's progress
// and what is open, and at its foot how long it has waited and the way in.
export const deskCard = stylex.create({
	card: {
		position: 'relative',
		display: 'flex',
		flexDirection: 'column',
		gap: '8px',
		paddingTop: '12px',
		paddingInline: '12px',
		paddingBottom: '10px',
		backgroundColor: color['--white'],
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: {
			default: color['--line'],
			[media.finePointer]: {
				default: color['--line'],
				':hover': color['--line-strong'],
			},
		},
		transition: `border-color ${transition.fast}`,
	},
	title: {
		fontSize: '14.5px',
		fontWeight: 500,
		letterSpacing: '-.01em',
		lineHeight: 1.3,
	},
	link: {
		color: 'inherit',
		textDecoration: 'none',
		outlineStyle: { default: null, ':focus-visible': 'none' },
	},
	// The link's area covers the card, and draws its focus ring around the card (the petrol
	// ring, over the card's own rule).
	stretch: {
		position: 'absolute',
		inset: '-1px',
		outlineWidth: { default: null, [linkFocus()]: '2px' },
		outlineStyle: { default: null, [linkFocus()]: 'solid' },
		outlineColor: color['--accent'],
		outlineOffset: '-1px',
	},
	meta: {
		fontFamily: font['--mono'],
		fontSize: '10.5px',
		color: color['--muted'],
		overflowWrap: 'anywhere',
	},
	words: { fontSize: '12px', lineHeight: 1.45, color: color['--wash-ink'] },
	progress: {
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
		fontFamily: font['--mono'],
		fontSize: '10.5px',
		color: color['--muted'],
	},
	track: { flex: '1', minWidth: '40px' },
	figure: { color: color['--ink'] },
	tags: { display: 'flex', flexWrap: 'wrap', gap: '6px' },
	foot: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: '8px',
		paddingTop: '8px',
		borderTopWidth: '1px',
		borderTopStyle: 'solid',
		borderTopColor: color['--line'],
		fontFamily: font['--mono'],
		fontSize: '10.5px',
		color: color['--muted'],
	},
	// Close and Open at the foot's end; Close sits above the card's link so it takes its click.
	end: {
		position: 'relative',
		zIndex: 1,
		display: 'inline-flex',
		alignItems: 'center',
		gap: '14px',
	},
	open: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '6px',
		fontFamily: font['--sans'],
		fontSize: '12.5px',
		fontWeight: 500,
		color: color['--accent'],
	},
	arrow: {
		width: '14px',
		height: '14px',
		transition: `transform ${transition.fast}`,
		transform: { default: null, [cardHover()]: 'translateX(3px)' },
	},
})

import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// A repository's group: its name, its root in mono and its count at the line's end, then its
// desks under a strong rule. On phones the root takes a line of its own under the name. A long
// root (64 characters at most, or what the line leaves) is cut from its start: roots share
// their prefix, and only the tail tells two repositories apart. The whole path is its title.
export const projectSection = stylex.create({
	root: { marginTop: { default: '44px', [media.phone]: '36px' } },
	head: {
		display: 'flex',
		flexWrap: 'wrap',
		alignItems: 'baseline',
		columnGap: '14px',
		rowGap: '2px',
		paddingBottom: '12px',
	},
	name: {
		fontSize: { default: '21px', [media.phone]: '19px' },
		fontWeight: 500,
		letterSpacing: '-.02em',
		lineHeight: 1.2,
		overflowWrap: 'anywhere',
	},
	path: {
		flexGrow: 1,
		flexShrink: 1,
		flexBasis: { default: '0', [media.phone]: '100%' },
		order: { default: 0, [media.phone]: 3 },
		minWidth: 0,
		maxWidth: '64ch',
		fontFamily: font['--mono'],
		fontSize: '12px',
		color: color['--muted'],
		whiteSpace: 'nowrap',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		// Right-to-left, the line overflows (and takes its ellipsis) at its start; the text is
		// held left-to-right by the marks around it (project-section.tsx) and set flush left.
		direction: 'rtl',
		textAlign: 'left',
	},
	// At the line's end, whether the root shares the line (it grows to push the count) or not.
	count: { marginLeft: 'auto' },
	list: {
		borderTopWidth: '1px',
		borderTopStyle: 'solid',
		borderTopColor: color['--line-strong'],
	},
})

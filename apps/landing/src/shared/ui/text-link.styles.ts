import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, duration, ease } from '@syneva/design-system/tokens.stylex'

import {
	chapterCopyMarker,
	pageActionsMarker,
	textLinkMarker,
} from './actions.stylex'

const linkHover = (): string => stylex.when.ancestor(':hover', textLinkMarker)
const inChapter = (): string =>
	stylex.when.ancestor(':is(div)', chapterCopyMarker)
const inPageActions = (): string =>
	stylex.when.ancestor(':is(div)', pageActionsMarker)

// The underlined text-link alternative to the primary action.
export const textLink = stylex.create({
	base: {
		fontSize: '14px',
		display: 'inline-flex',
		alignItems: 'center',
		gap: '12px',
		textDecoration: 'underline',
		textDecorationColor: {
			default: color['--line-strong'],
			':hover': color['--accent'],
		},
		color: { default: null, ':hover': color['--accent'] },
		transition: `color ${duration['--duration-fast']} ${ease['--ease-out']}, text-decoration-color ${duration['--duration-fast']} ${ease['--ease-out']}`,
		// A page's actions keep a touch-sized row on phones.
		minHeight: {
			default: null,
			[media.phone]: { default: null, [inPageActions()]: '44px' },
		},
	},
	inChapterSub: { marginTop: { default: null, [inChapter()]: '4px' } },
	arrow: {
		display: 'inline-block',
		transition: `transform ${duration['--duration-fast']} ${ease['--ease-out']}`,
		transform: { default: null, [linkHover()]: 'translateX(3px)' },
	},
})

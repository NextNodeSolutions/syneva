import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, ease } from '@syneva/design-system/tokens.stylex'

import { buttonMarker, textLinkMarker } from './actions.stylex'
import { chapterCopyMarker } from './chapter/chapter.stylex'
import { pageActionsMarker } from './page/page.stylex'

const buttonHover = (): string => stylex.when.ancestor(':hover', buttonMarker)
const linkHover = (): string => stylex.when.ancestor(':hover', textLinkMarker)
const inChapter = (): string =>
	stylex.when.ancestor(':is(div)', chapterCopyMarker)
const inPageActions = (): string =>
	stylex.when.ancestor(':is(div)', pageActionsMarker)

// The petrol primary action and the underlined text-link alternative.
export const button = stylex.create({
	base: {
		display: 'inline-flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: { default: '28px', [media.phone]: '14px' },
		minHeight: '52px',
		padding: { default: '12px 22px', [media.phone]: '11px 16px' },
		fontWeight: 500,
		fontSize: { default: '15px', [media.phone]: '14px' },
		transition: `background-color 150ms ${ease['--ease-out']}, border-color 150ms ${ease['--ease-out']}, transform 150ms ${ease['--ease-out']}`,
		transform: { default: null, ':active': 'scale(.97)' },
	},
	small: {
		minHeight: '44px',
		fontSize: '14px',
		padding: '10px 16px',
		gap: '18px',
	},
	primary: {
		color: color['--white'],
		backgroundColor: {
			default: color['--accent'],
			':hover': color['--accent-deep'],
		},
	},
	arrow: {
		width: '20px',
		height: '20px',
		stroke: 'currentColor',
		strokeWidth: 1.5,
		fill: 'none',
		transition: `transform .15s ${ease['--ease-out']}`,
		transform: { default: null, [buttonHover()]: 'translateX(3px)' },
	},
})

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
		transition: `color .15s ${ease['--ease-out']}, text-decoration-color .15s ${ease['--ease-out']}`,
		// A page's actions keep a touch-sized row on phones.
		minHeight: {
			default: null,
			[media.phone]: { default: null, [inPageActions()]: '44px' },
		},
	},
	inChapterSub: { marginTop: { default: null, [inChapter()]: '4px' } },
	arrow: {
		display: 'inline-block',
		transition: `transform .15s ${ease['--ease-out']}`,
		transform: { default: null, [linkHover()]: 'translateX(3px)' },
	},
})

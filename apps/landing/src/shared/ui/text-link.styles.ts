import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'

import { chapterCopyMarker, pageActionsMarker } from './actions.stylex'

const inChapter = (): string =>
	stylex.when.ancestor(':is(div)', chapterCopyMarker)
const inPageActions = (): string =>
	stylex.when.ancestor(':is(div)', pageActionsMarker)

// Where the site's text link sits, on top of the shared recipe
// (@syneva/design-system/inline.styles, textLink): a page's actions keep a
// touch-sized row on phones, the home's lone links a touch target, and
// subpages set a chapter's link a step lower.
export const textLinkPlace = stylex.create({
	base: {
		minHeight: {
			default: null,
			[media.phone]: { default: null, [inPageActions()]: '44px' },
		},
	},
	// On the home every text link stands alone, so on phones it takes a
	// centred 44px touch target that leaves the layout where it is.
	touch: {
		position: 'relative',
		'::after': {
			content: "''",
			position: 'absolute',
			insetInline: 0,
			top: '50%',
			height: '44px',
			transform: 'translateY(-50%)',
			display: { default: 'none', [media.phone]: 'block' },
		},
	},
	inChapterSub: { marginTop: { default: null, [inChapter()]: '4px' } },
})

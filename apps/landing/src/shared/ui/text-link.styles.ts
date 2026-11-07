import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'

import { chapterCopyMarker, pageActionsMarker } from './actions.stylex'

const inChapter = (): string =>
	stylex.when.ancestor(':is(div)', chapterCopyMarker)
const inPageActions = (): string =>
	stylex.when.ancestor(':is(div)', pageActionsMarker)

export const textLinkPlace = stylex.create({
	base: {
		minHeight: {
			default: null,
			[media.phone]: { default: null, [inPageActions()]: '44px' },
		},
	},
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

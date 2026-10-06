import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'

import { chapterArtMarker } from './chapter-art.stylex'

const inChapter = (): string =>
	stylex.when.ancestor(':is(figure)', chapterArtMarker)

// Width queries go widest first - StyleX keeps the last matching one - so the phone block restates the chapter case (the 640px column wins over the phone cap).
export const drawing = stylex.create({
	root: { width: '100%', height: 'auto' },
	compact: {
		maxWidth: { default: null, [media.phone]: '460px' },
		marginInline: { default: null, [media.phone]: 'auto' },
	},
	subpage: {
		maxWidth: {
			default: null,
			[media.narrow]: { default: null, [inChapter()]: '640px' },
		},
		maxHeight: {
			default: null,
			[media.narrow]: { default: null, [inChapter()]: 'none' },
		},
		marginInline: {
			default: null,
			[media.narrow]: { default: null, [inChapter()]: 'auto' },
		},
	},
	subpageCompact: {
		maxWidth: {
			default: null,
			[media.narrow]: { default: null, [inChapter()]: '640px' },
			[media.phone]: { default: '460px', [inChapter()]: '640px' },
		},
		maxHeight: {
			default: null,
			[media.narrow]: { default: null, [inChapter()]: 'none' },
		},
		marginInline: {
			default: null,
			[media.narrow]: { default: null, [inChapter()]: 'auto' },
			[media.phone]: 'auto',
		},
	},
})

import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/tokens/media.stylex'

import { chapterArtMarker } from './drawing.stylex'

const inChapter = (): string =>
	stylex.when.ancestor(':is(figure)', chapterArtMarker)

// The root <svg> of a drawing fills its figure. On phones a drawing that
// reframes (data-compact) never scales past ~1.5x its subject; on subpages a
// chapter's drawing keeps a 640px column from tablets down, which wins over
// the phone cap. Width queries go widest first: StyleX keeps the last
// matching one, so the phone block restates the chapter case.
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

import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, layout } from '@syneva/design-system/tokens.stylex'

const RHYTHM = {
	default: '96px',
	[media.narrow]: '72px',
	[media.phone]: '56px',
}

// The vertical rhythm every wide section shares, and the hairline that
// separates one section from the next.
export const section = stylex.create({
	pad: { paddingBlock: RHYTHM, paddingInline: layout['--gutter'] },
	// The rhythm alone, for a section with an edge-to-edge figure whose rows
	// carry the gutter themselves.
	rhythm: { paddingBlock: RHYTHM },
	ruled: {
		borderTopWidth: '1px',
		borderTopStyle: 'solid',
		borderTopColor: color['--line'],
	},
	// A heading row: the title, and its lede aligned to the title's foot,
	// stacking under 900px.
	head: {
		display: 'grid',
		gridTemplateColumns: {
			default: '1.25fr 1fr',
			[media.narrow]: 'minmax(0, 1fr)',
		},
		gap: { default: '70px', [media.narrow]: '24px' },
	},
	headText: { alignSelf: 'end', maxWidth: '440px' },
})

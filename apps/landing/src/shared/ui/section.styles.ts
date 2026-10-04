import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, layout } from '@syneva/design-system/tokens.stylex'

// The vertical rhythm every wide section shares, and the hairline that
// separates one section from the next.
export const section = stylex.create({
	pad: {
		paddingBlock: {
			default: '96px',
			[media.narrow]: '72px',
			[media.phone]: '56px',
		},
		paddingInline: layout['--gutter'],
	},
	ruled: {
		borderTopWidth: '1px',
		borderTopStyle: 'solid',
		borderTopColor: color['--line'],
	},
})

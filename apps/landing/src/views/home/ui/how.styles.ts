import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, layout } from '@syneva/design-system/tokens.stylex'

// How it works: the heading, the review circuit, then the four-step loop on
// one ruled rail, read left to right.
export const how = stylex.create({
	section: { scrollMarginTop: '12px' },
	head: {
		paddingBottom: { default: '56px', [media.phone]: '32px' },
		paddingInline: layout['--gutter'],
	},
	figure: {
		borderBlockWidth: '1px',
		borderBlockStyle: 'solid',
		borderBlockColor: color['--line'],
	},
	steps: {
		display: 'grid',
		gridTemplateColumns: {
			default: 'repeat(4, 1fr)',
			[media.narrow]: 'repeat(2, 1fr)',
			[media.phone]: '1fr',
		},
		columnGap: '32px',
		rowGap: {
			default: null,
			[media.narrow]: '40px',
			[media.phone]: '30px',
		},
		listStyle: 'none',
		margin: 0,
		padding: {
			default: `64px ${layout['--gutter']} 0`,
			[media.phone]: `40px ${layout['--gutter']} 0`,
		},
	},
	step: { padding: '22px 0 0' },
	stepTitle: {
		display: 'block',
		fontSize: '17px',
		fontWeight: 500,
		marginBottom: '8px',
	},
	stepText: { fontSize: '14px', maxWidth: '30ch' },
	stepLink: { marginTop: '14px' },
})

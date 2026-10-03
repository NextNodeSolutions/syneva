import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

const LINE = color['--line']
const PAD = { default: '96px', [media.narrow]: '72px', [media.phone]: '56px' }

// How it works: a heading row, the review circuit, then the four-step loop on
// one ruled rail, read left to right.
export const how = stylex.create({
	section: {
		borderTopWidth: '1px',
		borderTopStyle: 'solid',
		borderTopColor: LINE,
		scrollMarginTop: '12px',
	},
	head: {
		display: 'grid',
		gridTemplateColumns: {
			default: '1.25fr 1fr',
			[media.narrow]: 'minmax(0, 1fr)',
		},
		gap: { default: '70px', [media.narrow]: '24px' },
		paddingTop: PAD,
		paddingBottom: '56px',
		paddingInline: 'var(--gutter)',
	},
	headText: { alignSelf: 'end', maxWidth: '440px' },
	figure: {
		borderBlockWidth: '1px',
		borderBlockStyle: 'solid',
		borderBlockColor: LINE,
	},
	caption: {
		display: 'flex',
		padding: '12px 22px',
		borderTopWidth: '1px',
		borderTopStyle: 'solid',
		borderTopColor: LINE,
		color: color['--muted'],
		fontSize: '12px',
	},
	loop: {
		paddingTop: '64px',
		paddingBottom: PAD,
		paddingInline: 'var(--gutter)',
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
		padding: 0,
	},
	step: {
		borderTopWidth: '1px',
		borderTopStyle: 'solid',
		borderTopColor: color['--line-strong'],
		padding: '22px 0 0',
		position: 'relative',
		'::before': {
			content: "''",
			position: 'absolute',
			top: '-3.5px',
			left: 0,
			width: '7px',
			height: '7px',
			backgroundColor: color['--accent'],
		},
	},
	stepTitle: {
		display: 'block',
		fontSize: '17px',
		fontWeight: 500,
		marginBottom: '8px',
	},
	stepText: { fontSize: '14px', maxWidth: '30ch' },
	note: {
		marginTop: '46px',
		font: `12px ${font['--mono']}`,
		color: color['--muted'],
		'::before': { content: "'✓ '", color: color['--green'] },
	},
})

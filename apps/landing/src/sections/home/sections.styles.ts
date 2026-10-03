import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

const RULE_STRONG = {
	borderTopWidth: '1px',
	borderTopStyle: 'solid',
	borderTopColor: color['--line-strong'],
}
const MARKER = {
	content: "''",
	position: 'absolute',
	top: '-3.5px',
	left: 0,
	width: '7px',
	height: '7px',
	backgroundColor: color['--accent'],
}

// The landing's paired copy-and-figure sections: the problem, the product
// facts, local-first and the short FAQ.
export const problem = stylex.create({
	section: {
		display: 'grid',
		gridTemplateColumns: {
			default: 'minmax(0, 1fr) minmax(0, 1.12fr)',
			[media.tablet]: 'minmax(0, 1fr)',
		},
		gap: { default: '72px', [media.tablet]: '48px' },
		alignItems: 'center',
	},
	text: { marginTop: '22px', maxWidth: '470px' },
	emphasis: { color: color['--ink'] },
	figure: {
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line-strong'],
		backgroundColor: color['--field'],
		minWidth: 0,
	},
	caption: {
		font: `11px ${font['--mono']}`,
		color: color['--muted'],
		padding: '13px 20px',
		borderTopWidth: '1px',
		borderTopStyle: 'solid',
		borderTopColor: color['--line'],
	},
})

// Trust register: product facts, styled as a ruled register.
export const facts = stylex.create({
	head: {
		display: 'grid',
		gridTemplateColumns: { default: '1.25fr 1fr', [media.narrow]: '1fr' },
		gap: { default: '70px', [media.narrow]: '24px' },
		marginBottom: { default: '64px', [media.narrow]: '44px' },
	},
	headText: { alignSelf: 'end', maxWidth: '430px' },
	stats: {
		display: 'grid',
		gridTemplateColumns: {
			default: 'repeat(4, 1fr)',
			[media.narrow]: 'repeat(2, 1fr)',
		},
		columnGap: { default: '32px', [media.phone]: '18px' },
		rowGap: {
			default: '32px',
			[media.narrow]: '40px',
			[media.phone]: '28px',
		},
	},
	stat: {
		...RULE_STRONG,
		paddingTop: '22px',
		position: 'relative',
		'::before': MARKER,
	},
	number: {
		display: 'block',
		fontSize: 'clamp(46px, 5.4vw, 78px)',
		fontWeight: 500,
		letterSpacing: '-.045em',
		lineHeight: 1,
		fontVariantNumeric: 'tabular-nums',
	},
	first: { color: color['--accent'] },
	unit: { fontSize: '.55em', letterSpacing: 0 },
	label: {
		display: 'block',
		marginTop: '13px',
		color: color['--muted'],
		fontSize: { default: '14px', [media.phone]: '13px' },
		lineHeight: 1.55,
		maxWidth: '26ch',
	},
})

export const local = stylex.create({
	section: {
		display: 'grid',
		gridTemplateColumns: {
			default: 'minmax(0, 1fr) minmax(0, 1fr)',
			[media.tablet]: 'minmax(0, 1fr)',
		},
		gap: { default: '72px', [media.tablet]: '48px' },
		alignItems: 'center',
	},
	text: { maxWidth: '500px', marginTop: '24px' },
	points: {
		listStyle: 'none',
		padding: 0,
		margin: '28px 0 0',
		display: 'grid',
		gap: '10px',
		fontSize: '14px',
	},
	point: {
		paddingLeft: '24px',
		position: 'relative',
		'::before': {
			content: "''",
			position: 'absolute',
			left: 0,
			top: '6px',
			width: '11px',
			height: '11px',
			borderWidth: '1px',
			borderStyle: 'solid',
			borderColor: color['--green'],
			backgroundColor: color['--mint'],
		},
	},
	code: { fontSize: '12.5px' },
	note: { fontSize: '12px' },
})

export const faq = stylex.create({
	section: {
		display: 'grid',
		gridTemplateColumns: {
			default: '1fr 1.5fr',
			[media.stacked]: 'minmax(0, 1fr)',
		},
		gap: { default: '90px', [media.narrow]: '40px', [media.stacked]: 0 },
	},
	title: {
		fontSize: { default: '36px', [media.phone]: '31px' },
		marginBottom: { default: null, [media.stacked]: '30px' },
	},
	link: { marginTop: '22px' },
})

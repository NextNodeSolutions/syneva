import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

export const heroBody = stylex.create({
	body: {
		display: 'grid',
		gridTemplateColumns: {
			default: 'minmax(0, 4fr) minmax(0, 8fr)',
			[media.tablet]: 'minmax(0, 1fr)',
		},
		gap: { default: '48px', [media.tablet]: '44px' },
		marginTop: { default: '36px', [media.phone]: '32px' },
		alignItems: 'end',
	},
	copy: {
		display: {
			default: null,
			[media.tablet]: 'grid',
			[media.navToggle]: 'block',
		},
		gridTemplateColumns: { default: null, [media.tablet]: '1fr 1fr' },
		columnGap: { default: null, [media.tablet]: '40px' },
		alignItems: { default: null, [media.tablet]: 'start' },
	},
	lede: {
		fontSize: { default: '18px', [media.phone]: '16px' },
		lineHeight: 1.55,
		maxWidth: { default: '410px', [media.tablet]: 'none' },
		color: color['--muted'],
		gridColumn: { default: null, [media.tablet]: 1 },
		gridRow: { default: null, [media.tablet]: '1 / span 2' },
	},
	actions: {
		display: 'flex',
		alignItems: 'center',
		gap: '14px 26px',
		marginTop: {
			default: '30px',
			[media.tablet]: 0,
			[media.navToggle]: '28px',
		},
		flexWrap: 'wrap',
		gridColumn: { default: null, [media.tablet]: 2 },
	},
	command: {
		marginTop: { default: '30px', [media.tablet]: '20px' },
		maxWidth: '380px',
		gridColumn: { default: null, [media.tablet]: 2 },
	},
	signup: {
		marginTop: {
			default: '30px',
			[media.tablet]: 0,
			[media.navToggle]: '28px',
		},
		maxWidth: '380px',
		gridColumn: { default: null, [media.tablet]: 2 },
	},
	afterSignup: { marginTop: { default: '12px', [media.tablet]: '8px' } },
	works: {
		marginTop: { default: '34px', [media.tablet]: '24px' },
		font: `11.5px/1.75 ${font['--mono']}`,
		color: color['--muted'],
		maxWidth: { default: '380px', [media.tablet]: 'none' },
		gridColumn: { default: null, [media.tablet]: '1 / -1' },
	},
	worksLead: {
		display: { default: 'block', [media.tablet]: 'inline' },
		color: color['--ink'],
		textTransform: 'uppercase',
		letterSpacing: '.06em',
		fontSize: '10.5px',
		marginBottom: '2px',
		marginRight: { default: null, [media.tablet]: '8px' },
	},
	stage: {
		position: 'relative',
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--line-strong'],
		backgroundColor: color['--paper'],
		minWidth: 0,
	},
	stageAside: { display: { default: null, [media.phone]: 'none' } },
})

import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// The site's ruled facts at app scale: three stations, each under its own strong rule with
// the petrol square on the rule's start (hollow while its count is zero), a mono label, the
// count and the phrase it reads with.
export const hubRegister = stylex.create({
	list: {
		display: 'grid',
		gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
		columnGap: { default: '24px', [media.smallPhone]: '14px' },
	},
	station: { paddingTop: '16px' },
	stationZero: {
		'::before': {
			backgroundColor: color['--paper'],
			boxShadow: `inset 0 0 0 1px ${color['--accent']}`,
		},
	},
	label: {
		display: 'block',
		fontFamily: font['--mono'],
		fontSize: { default: '11px', [media.smallPhone]: '10.5px' },
		letterSpacing: '.06em',
		textTransform: 'uppercase',
		color: color['--muted'],
		whiteSpace: 'nowrap',
	},
	index: { marginRight: '8px', color: color['--accent'] },
	// "Your agent" gives way to "Agent" on the smallest phones.
	your: { display: { default: 'inline', [media.smallPhone]: 'none' } },
	count: {
		display: 'flex',
		flexDirection: { default: 'row', [media.smallPhone]: 'column' },
		alignItems: { default: 'baseline', [media.smallPhone]: 'flex-start' },
		columnGap: '8px',
		rowGap: '4px',
		marginTop: '10px',
	},
	number: {
		fontSize: { default: '34px', [media.phone]: '28px' },
		fontWeight: 500,
		letterSpacing: '-.045em',
		lineHeight: 1,
		color: color['--ink'],
	},
	numberZero: { color: color['--muted'] },
	phrase: { fontSize: '13px', lineHeight: 1.3, color: color['--muted'] },
	also: {
		marginTop: { default: '22px', [media.smallPhone]: '18px' },
		fontFamily: font['--mono'],
		fontSize: '11.5px',
		lineHeight: 1.5,
		color: color['--muted'],
		textWrap: 'balance',
	},
})

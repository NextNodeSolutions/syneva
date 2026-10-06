import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

const mono = {
	fontFamily: font['--mono'],
	fontSize: '11px',
	color: color['--muted'],
} as const

export const deskReview = stylex.create({
	cell: { gridArea: 'review', minWidth: 0 },
	approvals: {
		...mono,
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
		minHeight: '22px',
		marginTop: { default: '2px', [media.tablet]: 0 },
		whiteSpace: 'nowrap',
	},
	figure: { color: color['--ink'] },
	done: { color: color['--green'] },
	progress: {
		...mono,
		display: 'flex',
		flexWrap: 'wrap',
		alignItems: 'center',
		columnGap: '12px',
		rowGap: '2px',
		marginTop: '1px',
		lineHeight: 1.45,
	},
	item: {
		display: 'inline-flex',
		alignItems: 'center',
		gap: '7px',
		whiteSpace: 'nowrap',
	},
	requests: { color: color['--amber'] },
	questions: { color: color['--accent'] },
	warning: {
		display: 'flex',
		gap: '9px',
		marginTop: { default: '2px', [media.tablet]: 0 },
		fontSize: '13px',
		lineHeight: 1.45,
		color: color['--red'],
		textWrap: 'pretty',
	},
	warningDot: { marginTop: '6px' },
})

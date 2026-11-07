import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

import type { When } from '@syneva/design-system/when'

const LINE = color['--line']
const US = `color-mix(in srgb, ${color['--wash']} 45%, transparent)`
const phone = <T>(onPhones: T): When<T> => ({
	default: null,
	[media.phone]: onPhones,
})
const REGULAR = 400
// Empty alt text (after the plain fallback) keeps screen readers on the real column headers instead of announcing each label twice.
const LABEL = (): readonly string[] =>
	stylex.firstThatWorks('attr(data-label) / ""', 'attr(data-label)')
const US_LABEL = (): readonly string[] =>
	stylex.firstThatWorks(
		'\'✓ \' attr(data-label) / ""',
		"'✓ ' attr(data-label)",
	)

// Two categories, never a named competitor; stacked per aspect on phones, each cell labelled with its column since the head is hidden.
export const compare = stylex.create({
	head: { marginBottom: '52px' },
	scroll: { overflowX: { default: 'auto', [media.phone]: 'visible' } },
	table: {
		width: '100%',
		borderCollapse: 'collapse',
		fontSize: { default: '14px', [media.phone]: '13px' },
		display: phone('block'),
	},
	stacked: { display: phone('block') },
	thead: {
		position: phone('absolute'),
		width: phone('1px'),
		height: phone('1px'),
		overflow: phone('hidden'),
		clipPath: phone('inset(50%)'),
		whiteSpace: phone('nowrap'),
	},
	row: {
		display: phone('block'),
		padding: phone('18px 0'),
		borderBottomWidth: phone('1px'),
		borderBottomStyle: phone('solid'),
		borderBottomColor: phone(LINE),
	},
	cell: {
		textAlign: 'left',
		padding: '17px 18px',
		borderBottomWidth: '1px',
		borderBottomStyle: 'solid',
		borderBottomColor: LINE,
		verticalAlign: 'top',
	},
	column: {
		font: `11px ${font['--mono']}`,
		letterSpacing: '.05em',
		textTransform: 'uppercase',
		color: color['--muted'],
		borderBottomColor: color['--line-strong'],
		fontWeight: 400,
	},
	columnUs: {
		backgroundColor: US,
		color: color['--accent'],
		borderTopWidth: '2px',
		borderTopStyle: 'solid',
		borderTopColor: color['--accent'],
		fontWeight: 500,
	},
	aspect: {
		display: phone('block'),
		fontWeight: 500,
		width: { default: '22%', [media.phone]: 'auto' },
		padding: { default: '17px 18px', [media.phone]: 0 },
		paddingLeft: { default: 0, [media.phone]: 0 },
		borderBottomWidth: { default: '1px', [media.phone]: 0 },
		borderBottomStyle: { default: 'solid', [media.phone]: 'none' },
		borderBottomColor: { default: LINE, [media.phone]: 'currentcolor' },
		marginBottom: phone('10px'),
		fontSize: phone('14px'),
	},
	value: {
		display: phone('block'),
		color: color['--muted'],
		width: phone('auto'),
		padding: { default: '17px 18px', [media.phone]: '8px 12px' },
		borderBottomWidth: { default: '1px', [media.phone]: 0 },
		borderBottomStyle: { default: 'solid', [media.phone]: 'none' },
		borderBottomColor: { default: LINE, [media.phone]: 'currentcolor' },
		'::before': {
			content: phone(LABEL()),
			display: phone('block'),
			marginBottom: phone('2px'),
			font: phone(`10.5px ${font['--mono']}`),
			letterSpacing: phone('.05em'),
			textTransform: phone('uppercase'),
			color: phone(color['--muted']),
			fontWeight: phone(REGULAR),
		},
	},
	valueUs: {
		backgroundColor: US,
		color: color['--ink'],
		fontWeight: 500,
		'::before': {
			content: { default: "'✓'", [media.phone]: US_LABEL() },
			color: {
				default: color['--green'],
				[media.phone]: color['--accent'],
			},
			marginRight: { default: '9px', [media.phone]: 0 },
			// Restated under the phone query so it outranks the label's font shorthand there.
			fontWeight: { default: 600, [media.phone]: 600 },
		},
	},
})

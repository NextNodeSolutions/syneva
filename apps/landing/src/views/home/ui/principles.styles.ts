import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

const LINE = color['--line']

// Four product principles on one ruled strip, two by two on tablets.
export const principles = stylex.create({
	strip: {
		display: 'grid',
		gridTemplateColumns: {
			default: 'repeat(4, 1fr)',
			[media.narrow]: 'repeat(2, 1fr)',
		},
		borderBlockWidth: '1px',
		borderBlockStyle: 'solid',
		borderBlockColor: LINE,
		font: `12px ${font['--mono']}`,
		fontSize: { default: null, [media.phone]: '11px' },
		backgroundColor: color['--paper'],
	},
	item: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		gap: { default: '12px', [media.phone]: '8px' },
		padding: { default: '22px 12px', [media.phone]: '16px 8px' },
		textAlign: 'center',
	},
	// Every item after the first is ruled on its left; on tablets the second
	// row loses that rule at its start and gains one on top.
	notFirst: {
		borderLeftWidth: '1px',
		borderLeftStyle: 'solid',
		borderLeftColor: LINE,
	},
	rowStart: {
		borderLeftWidth: { default: '1px', [media.narrow]: 0 },
		borderLeftStyle: { default: 'solid', [media.narrow]: 'none' },
		borderLeftColor: { default: LINE, [media.narrow]: 'currentcolor' },
	},
	secondRow: {
		borderTopWidth: { default: null, [media.narrow]: '1px' },
		borderTopStyle: { default: null, [media.narrow]: 'solid' },
		borderTopColor: { default: null, [media.narrow]: LINE },
	},
	index: { fontWeight: 400, color: color['--accent'], fontSize: '10.5px' },
})

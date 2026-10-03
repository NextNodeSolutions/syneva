import * as stylex from '@stylexjs/stylex'
import { color, ease, font } from '@syneva/tokens/tokens.stylex'

import { copyMarker } from './command.stylex'
import { pageActionsMarker } from './page/page.stylex'

// `border: 0` resets the style and colour too, not just the width.
const noBorder = {
	borderWidth: 0,
	borderStyle: 'none',
	borderColor: 'currentcolor',
} as const

const copied = (): string => stylex.when.ancestor(':is(.is-copied)', copyMarker)
const inPageActions = (): string =>
	stylex.when.ancestor(':is(div)', pageActionsMarker)

const checkIn = stylex.keyframes({
	from: { transform: 'scale(.4)' },
	to: { transform: 'none' },
})

const icon = {
	height: '18px',
	width: '18px',
	stroke: 'currentColor',
	strokeWidth: 1.5,
	fill: 'none',
}

// The copyable command: a read-only field, a copy button and a live status.
export const command = stylex.create({
	box: {
		position: 'relative',
		display: 'flex',
		alignItems: 'center',
		gap: '12px',
		padding: '6px 6px 6px 16px',
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: {
			default: color['--line-strong'],
			':focus-within': color['--ink'],
			':has(.is-copied)': color['--green'],
		},
		backgroundColor: color['--white'],
		minWidth: 0,
		transition: `border-color .2s ${ease['--ease-out']}`,
		// Among a page's actions it shares the row instead of filling it.
		flex: { default: null, [inPageActions()]: '1 1 260px' },
		maxWidth: { default: null, [inPageActions()]: '340px' },
	},
	// In the install band the field sits on the wash: paper ground, petrol rule.
	install: {
		borderColor: {
			default: color['--accent-line'],
			':has(.is-copied)': color['--green'],
		},
		backgroundColor: color['--paper'],
	},
	prompt: { color: color['--accent'], font: `14px ${font['--mono']}` },
	field: {
		...noBorder,
		backgroundColor: 'transparent',
		minWidth: 0,
		width: '100%',
		outlineOffset: '1px',
		outline: { default: null, ':focus-visible': 'none' },
		font: `13.5px ${font['--mono']}`,
		caretColor: color['--accent'],
		padding: '8px 0',
	},
	copy: {
		display: 'grid',
		placeItems: 'center',
		backgroundColor: { default: 'transparent', ':hover': color['--wash'] },
		...noBorder,
		minWidth: '40px',
		height: '40px',
		flexShrink: 0,
	},
	iconCopy: { ...icon, display: { default: null, [copied()]: 'none' } },
	iconCheck: {
		...icon,
		stroke: color['--green'],
		display: { default: 'none', [copied()]: 'block' },
		animationName: { default: null, [copied()]: checkIn },
		animationDuration: { default: null, [copied()]: '.35s' },
		animationTimingFunction: {
			default: null,
			[copied()]: ease['--ease-spring'],
		},
	},
	status: {
		position: 'absolute',
		top: 'calc(100% + 6px)',
		left: 0,
		font: `11px ${font['--mono']}`,
		color: {
			default: color['--green'],
			':is(.is-error)': color['--accent'],
		},
		pointerEvents: 'none',
	},
})

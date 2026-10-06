import { pageActionsMarker } from '@shared/ui/actions.stylex'
import * as stylex from '@stylexjs/stylex'
import {
	color,
	duration,
	ease,
	font,
} from '@syneva/design-system/tokens.stylex'

import { copyMarker } from './command.stylex'

// border: 0 resets style and colour too, not just the width.
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
		transition: `border-color ${duration['--duration-medium']} ${ease['--ease-out']}`,
		flex: { default: null, [inPageActions()]: '1 1 260px' },
		maxWidth: { default: null, [inPageActions()]: '340px' },
	},
	// Merging over the box replaces its whole border value, so this rule restates the focus and copied states (they drop their outline).
	onWash: {
		borderColor: {
			default: color['--accent-line'],
			':focus-within': color['--ink'],
			':has(.is-copied)': color['--green'],
		},
		backgroundColor: color['--paper'],
	},
	prose: { margin: '8px 0 28px', maxWidth: '360px' },
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
		// A command wider than a narrow field shows it is cut; the copy button still copies all of it.
		textOverflow: 'ellipsis',
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
	// Out of flow so the gap after the box holds one status line that never wraps over what follows.
	status: {
		position: 'absolute',
		top: 'calc(100% + 6px)',
		left: 0,
		whiteSpace: 'nowrap',
		font: `11px ${font['--mono']}`,
		color: {
			default: color['--green'],
			':is(.is-error)': color['--accent'],
		},
		pointerEvents: 'none',
	},
})

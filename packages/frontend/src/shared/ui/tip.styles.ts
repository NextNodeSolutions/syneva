import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

import { deskText } from './desk.stylex'

// The fast tooltip: the native title waits ~1.5s, so a control names itself
// in its data-tip attribute and carries this style, which draws the label
// just under it after a short hover. Ink on paper, inverted, square: a label,
// not a card. `end` right-anchors it for controls near the right edge.
export const tip = stylex.create({
	host: {
		position: 'relative',
		'::after': {
			content: 'attr(data-tip)',
			position: 'absolute',
			top: 'calc(100% + 6px)',
			left: '50%',
			transform: 'translateX(-50%)',
			zIndex: 60,
			paddingBlock: '4px',
			paddingInline: '7px',
			whiteSpace: 'nowrap',
			pointerEvents: 'none',
			fontFamily: font['--sans'],
			fontSize: deskText.small,
			fontWeight: 400,
			letterSpacing: 0,
			textTransform: 'none',
			lineHeight: 1.3,
			color: color['--paper'],
			backgroundColor: color['--ink'],
			opacity: { default: 0, ':hover': 1 },
			transitionProperty: 'opacity',
			transitionDuration: '.1s',
			transitionDelay: { default: '0s', ':hover': '.18s' },
		},
	},
	end: {
		'::after': { left: 'auto', right: 0, transform: 'none' },
	},
	// Left-anchored, for controls near the left edge.
	start: {
		'::after': { left: 0, transform: 'none' },
	},
	// Over the control, for one whose underside holds labels the tip must not cover.
	above: {
		'::after': { top: 'auto', bottom: 'calc(100% + 6px)' },
	},
})

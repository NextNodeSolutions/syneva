import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

import { deskText } from './desk.stylex'

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

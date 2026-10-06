import * as stylex from '@stylexjs/stylex'
import { color, font } from '@syneva/design-system/tokens.stylex'

// The folded rail's labels: the desk's fast tooltip (shared/ui/tip.styles) turned to open at
// the rail's right, beside the icon it names, where the page has room for it.
export const railTip = stylex.create({
	host: {
		'::after': {
			content: 'attr(data-tip)',
			position: 'absolute',
			top: '50%',
			left: 'calc(100% + 10px)',
			transform: 'translateY(-50%)',
			zIndex: 60,
			paddingBlock: '5px',
			paddingInline: '8px',
			whiteSpace: 'nowrap',
			pointerEvents: 'none',
			fontFamily: font['--sans'],
			fontSize: '12px',
			lineHeight: 1.3,
			color: color['--paper'],
			backgroundColor: color['--ink'],
			opacity: { default: 0, ':hover': 1, ':focus-visible': 1 },
			transitionProperty: 'opacity',
			transitionDuration: '.1s',
			transitionDelay: { default: '0s', ':hover': '.15s' },
		},
	},
})

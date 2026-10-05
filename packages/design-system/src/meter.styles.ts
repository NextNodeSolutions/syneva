import * as stylex from '@stylexjs/stylex'

import { color, duration, ease } from './tokens.stylex'

// A share of a whole drawn as a thin track (the site's "1 of 5 settled"
// bar): green, because what it counts is the reviewer's verdict. The fill
// spans the track and scales to its ratio, so a change of share eases
// instead of jumping; a whole of nothing is a dashed rule, not an empty
// track that would read as 0%.
export const meter = stylex.create({
	track: {
		position: 'relative',
		display: 'inline-block',
		flexShrink: 0,
		width: '64px',
		height: '3px',
		overflow: 'hidden',
		backgroundColor: color['--line'],
	},
	fill: {
		position: 'absolute',
		top: 0,
		bottom: 0,
		left: 0,
		width: '100%',
		transformOrigin: 'left center',
		backgroundColor: color['--green'],
		transition: `transform ${duration['--duration-shift']} ${ease['--ease-out']}`,
	},
	// Composed over track when there is nothing to count.
	empty: {
		height: 0,
		backgroundColor: 'transparent',
		borderTopWidth: '1px',
		borderTopStyle: 'dashed',
		borderTopColor: color['--line-strong'],
	},
})

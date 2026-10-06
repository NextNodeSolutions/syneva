import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color } from '@syneva/design-system/tokens.stylex'

// The circuit's drawing, shared by the circuit band and the empty overview's review loop: the
// grid field it is drawn on, the petrol route from one station to the next, and the dotted
// return of the next round. Where each one sits (its padding, its height) is its caller's.
const PHONE = media.stacked

export const circuitRoute = stylex.create({
	field: {
		backgroundColor: color['--white'],
		backgroundImage: `linear-gradient(${color['--grid']} 1px, transparent 1px), linear-gradient(90deg, ${color['--grid']} 1px, transparent 1px)`,
		backgroundSize: '24px 24px',
		backgroundPosition: '-1px -1px',
	},
	route: {
		display: 'flex',
		alignItems: 'center',
		color: color['--accent'],
	},
	routeLine: {
		flex: '1',
		height: '1px',
		backgroundColor: 'currentColor',
		transformOrigin: 'left',
	},
	routeHead: {
		width: { default: '10px', [PHONE]: '7px' },
		height: { default: '10px', [PHONE]: '7px' },
		marginLeft: '-6px',
		fill: 'none',
		stroke: 'currentColor',
		strokeWidth: 1.5,
	},
	return: {
		position: 'relative',
		color: color['--accent-line'],
	},
	returnLine: {
		position: 'absolute',
		inset: 0,
		width: '100%',
		height: '100%',
		overflow: 'visible',
		fill: 'none',
		stroke: 'currentColor',
		strokeWidth: 1.5,
		strokeDasharray: '2 5',
	},
	returnHead: {
		position: 'absolute',
		top: '-3px',
		left: '-5px',
		width: '10px',
		height: '10px',
		fill: 'none',
		stroke: 'currentColor',
		strokeWidth: 1.5,
	},
})

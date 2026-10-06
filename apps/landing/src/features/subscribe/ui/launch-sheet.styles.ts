import * as stylex from '@stylexjs/stylex'
import { media } from '@syneva/design-system/media.stylex'
import { color, duration, ease } from '@syneva/design-system/tokens.stylex'

import { sheetMarker } from './signup.stylex'

const whileFocused = (): string =>
	stylex.when.ancestor(':focus-within', sheetMarker)

// A crop mark sits on its corner's lock point and rests 5px off it, outwards.
const CROP_LOCK = '-6px'

export const launchSheet = stylex.create({
	root: {
		position: 'relative',
		minWidth: 0,
		backgroundColor: color['--white'],
		borderWidth: '1px',
		borderStyle: 'solid',
		borderColor: color['--accent-line'],
	},
	// Four crop marks, as on the docked header: resting off the corners in the band's rule tone, closing in petrol while a field inside has focus (CSS alone, no script).
	crop: {
		position: 'absolute',
		width: '10px',
		height: '10px',
		borderWidth: 0,
		borderStyle: 'solid',
		borderColor: {
			default: color['--accent-line'],
			[whileFocused()]: color['--accent'],
		},
		pointerEvents: 'none',
		transition: {
			default: null,
			[media.motionSafe]: `transform ${duration['--duration-spring-medium']} ${ease['--ease-spring']}, border-color ${duration['--duration-medium']} ${ease['--ease-out']}`,
		},
	},
	topLeft: {
		top: CROP_LOCK,
		left: CROP_LOCK,
		borderTopWidth: '1px',
		borderLeftWidth: '1px',
		transform: {
			default: 'translate(-5px, -5px)',
			[whileFocused()]: 'none',
		},
	},
	topRight: {
		top: CROP_LOCK,
		right: CROP_LOCK,
		borderTopWidth: '1px',
		borderRightWidth: '1px',
		transform: {
			default: 'translate(5px, -5px)',
			[whileFocused()]: 'none',
		},
	},
	bottomLeft: {
		bottom: CROP_LOCK,
		left: CROP_LOCK,
		borderBottomWidth: '1px',
		borderLeftWidth: '1px',
		transform: {
			default: 'translate(-5px, 5px)',
			[whileFocused()]: 'none',
		},
	},
	bottomRight: {
		bottom: CROP_LOCK,
		right: CROP_LOCK,
		borderBottomWidth: '1px',
		borderRightWidth: '1px',
		transform: {
			default: 'translate(5px, 5px)',
			[whileFocused()]: 'none',
		},
	},
})

import * as stylex from '@stylexjs/stylex'

import { transition } from './transitions.stylex'

// Compose press.control BEFORE a control's own styles, so a control that transforms otherwise keeps the last word.
export const press = stylex.create({
	control: {
		transition: `background-color ${transition.fast}, border-color ${transition.fast}, transform ${transition.fast}`,
		transform: { default: null, ':active': 'scale(.97)' },
	},
})

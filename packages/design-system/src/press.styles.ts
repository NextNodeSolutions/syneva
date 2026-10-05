import * as stylex from '@stylexjs/stylex'

import { transition } from './transitions.stylex'

// A pressable control: its fill and border ease into their hover colours and
// it gives a little under the pointer. Controls compose it before their own
// styles, so a control that moves otherwise keeps the last word.
export const press = stylex.create({
	control: {
		transition: `background-color ${transition.fast}, border-color ${transition.fast}, transform ${transition.fast}`,
		transform: { default: null, ':active': 'scale(.97)' },
	},
})

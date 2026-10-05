import * as stylex from '@stylexjs/stylex'
import { duration, ease } from '@syneva/design-system/tokens.stylex'

const fast = `${duration['--duration-fast']} ${ease['--ease-out']}`

// A pressable control: its fill and border ease into their hover colours and
// it gives a little under the pointer. Controls compose it before their own
// styles, so a control that moves otherwise keeps the last word.
export const press = stylex.create({
	control: {
		transition: `background-color ${fast}, border-color ${fast}, transform ${fast}`,
		transform: { default: null, ':active': 'scale(.97)' },
	},
})

import { focusLeave } from './focus-leave'

import type { FocusEvent } from 'react'

export type Holder = 'pointer' | 'focus'

export type Hold = {
	hold: (holder: Holder) => void
	release: (holder: Holder) => void
}

export type HoldListeners = {
	onPointerEnter: () => void
	onPointerLeave: () => void
	onFocus: () => void
	onBlur: (event: FocusEvent<HTMLElement>) => void
}

export function holdListeners({ hold, release }: Hold): HoldListeners {
	return {
		onPointerEnter: () => hold('pointer'),
		onPointerLeave: () => release('pointer'),
		onFocus: () => hold('focus'),
		onBlur: event => {
			if (focusLeave(event) !== 'inside') release('focus')
		},
	}
}

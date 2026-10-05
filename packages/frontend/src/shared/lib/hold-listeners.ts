import { focusLeave } from './focus-leave'

import type { FocusEvent } from 'react'

// What holds a surface still: the pointer over it, or focus inside it.
export type Holder = 'pointer' | 'focus'

export type Hold = {
	hold: (holder: Holder) => void
	release: (holder: Holder) => void
}

// The handlers a held surface spreads on its element.
export type HoldListeners = {
	onPointerEnter: () => void
	onPointerLeave: () => void
	onFocus: () => void
	onBlur: (event: FocusEvent<HTMLElement>) => void
}

// The pointer entering or leaving, focus coming in or going out. Focus moving between elements
// inside keeps the hold; a blur to nowhere releases it, since nothing inside holds focus any
// more.
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

import type { FocusEvent } from 'react'

// Where focus went as it left an element: to another element inside it, to one outside it, or
// nowhere the event names - a click on bare page, a window losing focus, or Safari, which does
// not focus a clicked button. Each caller decides what "nowhere" means for it.
export type FocusLeave = 'inside' | 'outside' | 'unknown'

export function focusLeave(event: FocusEvent<HTMLElement>): FocusLeave {
	const next = event.relatedTarget
	if (!(next instanceof Node)) return 'unknown'
	return event.currentTarget.contains(next) ? 'inside' : 'outside'
}

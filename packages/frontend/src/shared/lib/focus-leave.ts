import type { FocusEvent } from 'react'

export type FocusLeave = 'inside' | 'outside' | 'unknown'

export function focusLeave(event: FocusEvent<HTMLElement>): FocusLeave {
	const next = event.relatedTarget
	if (!(next instanceof Node)) return 'unknown'
	return event.currentTarget.contains(next) ? 'inside' : 'outside'
}

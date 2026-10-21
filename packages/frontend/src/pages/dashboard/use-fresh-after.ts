import { useState } from 'react'

import type { Journal } from '@entities/hub/journal'

// The newest event the page has heard of (its `heard` ordinal, which no seq can stand for across
// hubs).
function newestHeard(journal: Journal): number {
	return Math.max(0, ...journal.events.map(event => event.heard))
}

// Where the events that just arrived begin for a view of the journal: past the last read's
// arrivals and past what the journal held when the view mounted. An event lands on the wash
// once, while the view is open: a view that mounts again (another display, another page)
// washes only what arrives after it.
export function useFreshAfter(journal: Journal): number {
	const [mountedAfter] = useState(() => newestHeard(journal))
	return Math.max(
		journal.freshAfter ?? Number.POSITIVE_INFINITY,
		mountedAfter,
	)
}

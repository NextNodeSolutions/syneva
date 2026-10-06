import { useState } from 'react'

import type { Journal } from '@entities/hub/journal'

// Where the events that just arrived begin for a view of the journal: past the last read's
// arrivals and past what the journal held when the view mounted. An event lands on the wash
// once, while the view is open: a view that mounts again (another display, another page)
// washes only what arrives after it.
export function useFreshAfter(journal: Journal): number {
	const [mountedAfter] = useState(() => journal.events.at(-1)?.seq ?? 0)
	return Math.max(
		journal.freshAfter ?? Number.POSITIVE_INFINITY,
		mountedAfter,
	)
}

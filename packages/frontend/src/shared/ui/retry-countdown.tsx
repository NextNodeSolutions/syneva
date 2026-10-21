import { untilWords } from '@shared/lib/until-words'
import { useNow } from '@shared/lib/use-now'

import type { ReactElement } from 'react'

function retryWords(retryAt: number | null, now: number): string {
	if (!retryAt || retryAt <= now) return 'Trying again now.'
	return `Retrying in ${untilWords(retryAt, now)}.`
}

// When the hub's stream tries again, counted down on the page's clock (null: an attempt is under
// way). Hidden from assistive tech: the status around it says the wait once, not every tick.
export function RetryCountdown({
	retryAt,
}: {
	retryAt: number | null
}): ReactElement {
	const now = useNow()
	return <span aria-hidden="true">{retryWords(retryAt, now)}</span>
}

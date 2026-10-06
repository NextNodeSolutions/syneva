import { isDeskClosed } from '@entities/hub/journal'

import type { DeskClosed, JournalEvent } from '@entities/hub/journal'

// The desks that left the hub, newest first, each once (its latest close), leaving out any desk
// open again since: the history a reviewer reopens from. Their review stays saved, so a reopen
// brings the verdicts back.
export function closedDesks(
	events: readonly JournalEvent[],
	liveIds: ReadonlySet<string>,
): DeskClosed[] {
	const seen = new Set<string>()
	const closed: DeskClosed[] = []
	for (const event of events.toReversed()) {
		if (!isDeskClosed(event) || seen.has(event.deskId)) continue
		seen.add(event.deskId)
		if (!liveIds.has(event.deskId)) closed.push(event)
	}
	return closed
}

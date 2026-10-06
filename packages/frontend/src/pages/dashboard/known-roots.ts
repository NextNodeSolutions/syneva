import type { JournalEvent } from '@entities/hub/journal'
import type { HubProject } from '@entities/hub/model'

// The repositories New review suggests: the live ones first, then every one the journal
// remembers, newest first, each once.
export function knownRoots(
	projects: readonly HubProject[],
	events: readonly JournalEvent[],
): string[] {
	const roots = new Set(projects.map(project => project.root))
	for (const event of events.toReversed()) roots.add(event.root)
	return [...roots]
}

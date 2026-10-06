import { DAY_MS, roundsSince, WEEK_DAYS } from '@entities/hub/journal-stats'
import { turnCounts } from '@entities/hub/turn'

import type { JournalEvent } from '@entities/hub/journal'
import type { HubDesk, HubProject } from '@entities/hub/model'

// One repository as the Projects page lists it: the live ones from the listing, and the ones
// the journal remembers with no desk open now (their history still reads).
export type ProjectEntry = {
	id: string
	name: string
	root: string
	desks: readonly HubDesk[]
	yours: number
	roundsThisWeek: number
	// When anything last happened there: its newest event, else its desks' activity.
	lastAt: string | null
}

function lastEventAt(
	events: readonly JournalEvent[],
	id: string,
): string | null {
	return events.findLast(event => event.projectId === id)?.at ?? null
}

export function projectIndex(
	projects: readonly HubProject[],
	events: readonly JournalEvent[],
	now: number,
): ProjectEntry[] {
	const week = roundsSince(events, now - WEEK_DAYS * DAY_MS)
	const entry = (
		id: string,
		name: string,
		root: string,
		desks: readonly HubDesk[],
	): ProjectEntry => ({
		id,
		name,
		root,
		desks,
		yours: turnCounts(desks).yours,
		roundsThisWeek: week.filter(round => round.projectId === id).length,
		lastAt: lastEventAt(events, id) ?? desks[0]?.lastActivityAt ?? null,
	})
	const live = projects.map(project =>
		entry(project.id, project.name, project.root, project.desks),
	)
	const liveIds = new Set(live.map(project => project.id))
	const remembered = new Map<string, ProjectEntry>()
	for (const event of events)
		if (!liveIds.has(event.projectId))
			remembered.set(
				event.projectId,
				entry(event.projectId, event.project, event.root, []),
			)
	return [...live, ...[...remembered.values()].toReversed()]
}

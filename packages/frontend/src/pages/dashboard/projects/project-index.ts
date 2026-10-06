import { isRoundSent } from '@entities/hub/journal'
import { DAY_MS, WEEK_DAYS } from '@entities/hub/journal-stats'
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

// What the journal says about one repository: its name and root as its newest event names
// them, when that event happened, and the rounds sent there this week.
type Remembered = {
	name: string
	root: string
	lastAt: string
	roundsThisWeek: number
}

// Every repository the journal names, in one pass, in the order each first appears.
function remembered(
	events: readonly JournalEvent[],
	weekAgo: number,
): Map<string, Remembered> {
	const projects = new Map<string, Remembered>()
	for (const event of events) {
		const project = projects.get(event.projectId) ?? {
			name: event.project,
			root: event.root,
			lastAt: event.at,
			roundsThisWeek: 0,
		}
		project.name = event.project
		project.root = event.root
		project.lastAt = event.at
		if (isRoundSent(event) && Date.parse(event.at) >= weekAgo)
			project.roundsThisWeek += 1
		projects.set(event.projectId, project)
	}
	return projects
}

function liveEntry(
	project: HubProject,
	journal: Remembered | undefined,
): ProjectEntry {
	return {
		id: project.id,
		name: project.name,
		root: project.root,
		desks: project.desks,
		yours: turnCounts(project.desks).yours,
		roundsThisWeek: journal?.roundsThisWeek ?? 0,
		lastAt: journal?.lastAt ?? project.desks[0]?.lastActivityAt ?? null,
	}
}

// A repository with no desk open now: its history still reads.
function goneEntry(id: string, project: Remembered): ProjectEntry {
	return {
		id,
		name: project.name,
		root: project.root,
		desks: [],
		yours: 0,
		roundsThisWeek: project.roundsThisWeek,
		lastAt: project.lastAt,
	}
}

export function projectIndex(
	projects: readonly HubProject[],
	events: readonly JournalEvent[],
	now: number,
): ProjectEntry[] {
	const journal = remembered(events, now - WEEK_DAYS * DAY_MS)
	const live = projects.map(project =>
		liveEntry(project, journal.get(project.id)),
	)
	const liveIds = new Set(projects.map(project => project.id))
	const gone = [...journal]
		.filter(([id]) => !liveIds.has(id))
		.map(([id, project]) => goneEntry(id, project))
	return [...live, ...gone.toReversed()]
}

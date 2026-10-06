import type { DeskClosed } from '@entities/hub/journal'

// How much history the empty overview holds: the repositories closed most recently, a couple
// of desks each. The rest is one link away, on Reviews.
const MAX_GROUPS = 3
const MAX_PER_GROUP = 2

export type ResumeGroup = {
	projectId: string
	project: string
	root: string
	// Every desk closed in this repository, shown or not.
	total: number
	desks: readonly DeskClosed[]
}

export type Resume = {
	groups: readonly ResumeGroup[]
	// Every closed desk, and the rows kept of them.
	total: number
	shown: number
	last: DeskClosed | null
}

type OpenGroup = Omit<ResumeGroup, 'desks'> & { desks: DeskClosed[] }

// The closed desks (newest first) by repository, the repository closed most recently first and
// its newest desk first.
export function resumeOf(closed: readonly DeskClosed[]): Resume {
	const groups = new Map<string, OpenGroup>()
	for (const desk of closed) {
		const group = groups.get(desk.projectId) ?? {
			projectId: desk.projectId,
			project: desk.project,
			root: desk.root,
			total: 0,
			desks: [],
		}
		group.total += 1
		if (group.desks.length < MAX_PER_GROUP) group.desks.push(desk)
		groups.set(desk.projectId, group)
	}
	const kept = [...groups.values()].slice(0, MAX_GROUPS)
	return {
		groups: kept,
		total: closed.length,
		shown: kept.reduce((sum, group) => sum + group.desks.length, 0),
		last: closed[0] ?? null,
	}
}

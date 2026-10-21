// Declared structurally here (NOT re-exported from @contracts) so contract DTOs cannot escape the entity API boundary - the browser consumes these models only; keep structurally in sync with packages/contracts/src/hub.ts.

export type ReviewMode = 'repo' | 'file' | 'pr'

export type HubDesk = {
	id: string
	root: string
	project: string
	projectId: string
	session: string
	mode: ReviewMode
	target?: string | undefined
	staged: boolean
	baseDiffHash: string
	empty: boolean
	files: number
	approvedFiles: number
	totalChanges: number
	decidedChanges: number
	openQuestions: number
	openRequests: number
	agentListening: boolean
	agentActivity: { body: string; at: string } | null
	queuedQuestions: number
	queuedReviews: number
	openedAt: string
	lastActivityAt: string
	path: string
	// The plan this desk reviews (`syneva open plan`): its id in the plan library.
	plan: string | null
}

// Who the hub on the other end of the stream is: its first frame says it, and `instanceId`
// changes on every start.
export type HubIdentity = {
	id: string
	// The machine's hostname.
	name: string
	version: string
	instanceId: string
	startedAt: string
}

export type HubHealth = {
	version: string
	instanceId: string
	startedAt: string
	desks: number
	keyRequired: boolean
}

export type HubProject = {
	root: string
	id: string
	name: string
	desks: HubDesk[]
	lastActivityAt: string
}

// A repository as every listing groups by it: keyed by its root, named as the hub names it
// (its folder) or, failing that, by its path. Desks and plans group the same way.
export function projectName(of: { project: string; root: string }): string {
	return of.project || of.root
}

export function groupByProject(desks: readonly HubDesk[]): HubProject[] {
	const byRoot = new Map<string, HubProject>()
	for (const desk of desks) {
		const project = byRoot.get(desk.root) ?? {
			root: desk.root,
			id: desk.projectId,
			name: projectName(desk),
			desks: [],
			lastActivityAt: desk.lastActivityAt,
		}
		project.desks.push(desk)
		if (desk.lastActivityAt > project.lastActivityAt)
			project.lastActivityAt = desk.lastActivityAt
		byRoot.set(desk.root, project)
	}
	const projects = [...byRoot.values()]
	for (const project of projects)
		project.desks = project.desks.toSorted((a, b) =>
			b.lastActivityAt.localeCompare(a.lastActivityAt),
		)
	return projects.toSorted((a, b) =>
		b.lastActivityAt.localeCompare(a.lastActivityAt),
	)
}

export type NewDeskInput = {
	root: string
	mode: ReviewMode
	staged: boolean
	target?: string | undefined
	session?: string | undefined
	base?: string | undefined
	path?: string | undefined
	// A file desk over a plan: the hub keeps its versions in the plan library.
	plan?: boolean | undefined
}

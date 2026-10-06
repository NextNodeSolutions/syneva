// Frontend-owned hub models: what the dashboard renders. Declared structurally here (NOT
// re-exported from @contracts) so contract DTOs cannot escape the entity API boundary - the
// browser consumes these models only, and api.ts is the single place wire payloads are decoded
// onto them. Keep structurally in sync with packages/contracts/src/hub.ts.

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
}

export type HubHealth = {
	version: string
	instanceId: string
	startedAt: string
	desks: number
	keyRequired: boolean
}

// One repository on the hub and its desks - the dashboard's grouping unit.
export type HubProject = {
	root: string
	id: string
	name: string
	desks: HubDesk[]
	lastActivityAt: string
}

// Group desks by repo root, most recently active project first, each project's desks most
// recently active first - the order a reviewer coming back to the hub expects.
export function groupByProject(desks: readonly HubDesk[]): HubProject[] {
	const byRoot = new Map<string, HubProject>()
	for (const desk of desks) {
		const project = byRoot.get(desk.root) ?? {
			root: desk.root,
			id: desk.projectId,
			name: desk.project || desk.root,
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

// What the dashboard's "New review" form posts: the same open the CLI performs.
export type NewDeskInput = {
	root: string
	mode: ReviewMode
	staged: boolean
	target?: string | undefined
	session?: string | undefined
}

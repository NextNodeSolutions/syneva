// Declared structurally here (NOT re-exported from @contracts) so contract DTOs cannot escape the entity API boundary - the browser consumes these models only; keep structurally in sync with packages/contracts/src/hub.ts.

export type ReviewMode = 'repo' | 'file' | 'pr'

// A hub the page knows by the stream: the local hub, or one of the person's paired hubs on the
// web. `isOnline` is whether its socket is open now (the web's `hub` frames); `lastSeenAt` the
// last time it connected, epoch ms, when the web says it.
export type HubRef = {
	id: string
	name: string
	isOnline: boolean
	version: string | null
	lastSeenAt: number | null
}

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
	// The hub the desk lives on, as its `desk` frame names it (`local` on the local hub), and that
	// hub as the stream last described it; null on the local hub, where the hub is the page's own.
	hubId: string
	hub: HubRef | null
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

// Who is signed in on the web.
export type WebMe = { userId: string; email: string }

export type HubHealth = {
	version: string
	instanceId: string
	startedAt: string
	desks: number
	keyRequired: boolean
}

export type HubProject = {
	// The hub the repository's desks live on.
	hubId: string
	root: string
	id: string
	name: string
	desks: HubDesk[]
	lastActivityAt: string
}

// A repository as every listing groups by it: keyed by its project id (the digest of its root,
// scoped by its hub on the web, so two hubs' checkouts at one path stay two projects), named as the
// hub names it (its folder) or, failing that, by its path. Desks and plans group the same way.
export function projectName(of: { project: string; root: string }): string {
	return of.project || of.root
}

export function groupByProject(desks: readonly HubDesk[]): HubProject[] {
	const byProject = new Map<string, HubProject>()
	for (const desk of desks) {
		const project = byProject.get(desk.projectId) ?? {
			hubId: desk.hubId,
			root: desk.root,
			id: desk.projectId,
			name: projectName(desk),
			desks: [],
			lastActivityAt: desk.lastActivityAt,
		}
		project.desks.push(desk)
		if (desk.lastActivityAt > project.lastActivityAt)
			project.lastActivityAt = desk.lastActivityAt
		byProject.set(desk.projectId, project)
	}
	const projects = [...byProject.values()]
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

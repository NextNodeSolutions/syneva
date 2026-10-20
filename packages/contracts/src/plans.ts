// The hub's plan library: every plan an agent opened with `syneva open plan`, each version it
// posted and where its review stands. A plan desk is a file desk the hub also keeps a record
// for; the record outlives the desk (RFC 0002).

// draft: the latest version is not approved yet. approved: a Send approved the file at its
// latest version. implemented / archived: the reviewer's own word, set from the plan's page;
// a new version brings either back to draft.
export type PlanStatus = 'draft' | 'approved' | 'implemented' | 'archived'

// What the reviewer may set by hand; approval only ever comes from a Send.
export type PlanStatusChange = 'draft' | 'implemented' | 'archived'

export type PlanVersionSummary = {
	// 1-based, in posting order.
	number: number
	postedAt: string
	// The title the version carried (its front matter, its first heading, or the file name).
	title: string
	approvedAt?: string | undefined
}

// The live desk reviewing the plan now, if any.
export type PlanDesk = {
	id: string
	// Desk page path (/d/<id>/), relative so valid behind any origin.
	path: string
}

export type PlanSummary = {
	// Stable per repo + plan file: the same record across desks and hub restarts.
	id: string
	root: string
	project: string
	projectId: string
	// The plan file, relative to the root.
	path: string
	title: string
	summary?: string | undefined
	status: PlanStatus
	versions: PlanVersionSummary[]
	createdAt: string
	updatedAt: string
	desk: PlanDesk | null
}

// GET /api/hub/plans: every plan the hub keeps, the most recently moved first.
export type PlansResponse = { plans: PlanSummary[] }

// GET /api/hub/plans/<id>: the record and its latest version's markdown.
export type PlanResponse = { plan: PlanSummary; markdown: string }

// GET /api/hub/plans/<id>/versions/<n>: one version as it was posted.
export type PlanVersionResponse = { number: number; markdown: string }

// POST /api/hub/plans/<id>/status
export type PlanStatusRequest = { status: PlanStatusChange }

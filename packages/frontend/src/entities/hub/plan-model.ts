// The hub's plan library as the dashboard holds it: decoded from the wire at api.ts, so the
// pages never read a contract shape.

import type { HubDesk } from './model'

export const PLAN_STATUSES = [
	'draft',
	'approved',
	'implemented',
	'archived',
] as const

export type PlanStatus = (typeof PLAN_STATUSES)[number]

// What the reviewer may set by hand: approval only ever comes from a Send on the plan's desk.
export type PlanStatusChange = Exclude<PlanStatus, 'approved'>

export type PlanVersion = {
	number: number
	postedAt: string
	title: string
	approvedAt: string | null
}

export type Plan = {
	id: string
	root: string
	project: string
	projectId: string
	path: string
	title: string
	summary: string | null
	status: PlanStatus
	versions: PlanVersion[]
	createdAt: string
	updatedAt: string
	// The live desk reviewing the plan now: its page path, relative to the hub.
	deskPath: string | null
}

export type PlanDocument = { plan: Plan; markdown: string }

export type PlanProject = {
	projectId: string
	project: string
	root: string
	plans: Plan[]
}

// The latest version is the one the plan is read at; a record always has one.
export function latestVersion(plan: Plan): PlanVersion | undefined {
	return plan.versions.at(-1)
}

// What makes two reads of a plan the same for a page: where it stands, on which desk, and
// whether its latest version is approved. A new version moves updatedAt.
export function planSignature(plan: Plan): string {
	return [
		plan.id,
		plan.updatedAt,
		plan.status,
		plan.deskPath ?? '',
		latestVersion(plan)?.approvedAt ?? '',
	].join(' ')
}

// The library by repository, in the order the hub listed them (the most recently moved plan
// first), so the project that moved last leads.
export function plansByProject(plans: readonly Plan[]): PlanProject[] {
	const projects = new Map<string, PlanProject>()
	for (const plan of plans) {
		const held = projects.get(plan.projectId)
		if (held) held.plans.push(plan)
		else
			projects.set(plan.projectId, {
				projectId: plan.projectId,
				project: plan.project,
				root: plan.root,
				plans: [plan],
			})
	}
	return [...projects.values()]
}

// The desks reviewing a plan: a file desk that is not a plan is a review like any other.
export function planDesks(desks: readonly HubDesk[]): HubDesk[] {
	return desks.filter(desk => desk.plan !== null)
}

// A plan joined to its live desk: the one the hub's listing shows reviewing it, and the page
// path that reaches it. The listing's poll is ahead of the library's, which can lag it, so the
// listing's desk comes first and the library's own word (`deskPath`) stands in when the
// listing shows none: a desk still open is linked, never reopened (a reload) to be reached.
export type PlanDeskJoin = { desk: HubDesk | undefined; path: string | null }

export function deskOfPlan(
	plan: Plan,
	desks: readonly HubDesk[],
): PlanDeskJoin {
	const desk = desks.find(live => live.plan === plan.id)
	return { desk, path: desk?.path ?? plan.deskPath }
}

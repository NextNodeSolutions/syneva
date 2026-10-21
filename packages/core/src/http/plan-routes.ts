import { HUB_PATHS, deskPagePath } from '@syneva/contracts/routes'

import { planSummary } from '../application/plan-library.js'
import { isHexId } from '../domain/identity.js'
import { isPlanStatusChange } from '../domain/plan.js'
import { deskPlanId } from '../hub/hosted-desk.js'

import {
	HTTP_NOT_FOUND,
	HTTP_OK,
	HTTP_UNPROCESSABLE,
	fail,
	json,
	readJsonBody,
} from './http.js'

import type {
	PlanDesk,
	PlanResponse,
	PlansResponse,
	PlanVersionResponse,
} from '@syneva/contracts/plans'
import type { PlanLibrary } from '../application/plan-library.js'
import type { PlanRecord } from '../domain/plan.js'
import type { Hub } from '../hub/hub.js'
import type { HubRequest } from './exchange.js'
import type { ApiFailure } from './failure.js'

export type PlanRouteDeps = { hub: Hub; plans: PlanLibrary }

// A version is 1-based.
const VERSION = /^[1-9]\d*$/
// /<id>/versions/<n>: the two segments after the plan's id.
const VERSION_SEGMENTS = 2

const PLAN_NOT_FOUND: ApiFailure = {
	status: HTTP_NOT_FOUND,
	code: 'PLAN_NOT_FOUND',
	error: 'No plan with that id on this hub.',
	fix: `List plans with GET ${HUB_PATHS.plans}, or open one with \`syneva open plan <path>\`.`,
}

const VERSION_NOT_FOUND: ApiFailure = {
	status: HTTP_NOT_FOUND,
	code: 'VERSION_NOT_FOUND',
	error: 'That plan has no such version on this hub.',
	fix: `Read the plan's versions with GET ${HUB_PATHS.plans}/<id>.`,
}

// /api/hub/plans[/<id>[/versions/<n> | /status]]: the plan library (PlansResponse,
// PlanResponse, PlanVersionResponse). Null when the path is none of them, so the router goes on.
export async function planApi(
	deps: PlanRouteDeps,
	{ request, url }: HubRequest,
): Promise<Response | null> {
	const { pathname } = url
	if (pathname === HUB_PATHS.plans && request.method === 'GET')
		return listPlans(deps)
	if (!pathname.startsWith(`${HUB_PATHS.plans}/`)) return null
	const [id = '', ...rest] = pathname
		.slice(HUB_PATHS.plans.length + 1)
		.split('/')
	if (!isHexId(id)) return null
	return dispatchPlan(deps, request, id, rest)
}

async function dispatchPlan(
	deps: PlanRouteDeps,
	request: Request,
	id: string,
	rest: readonly string[],
): Promise<Response | null> {
	const [segment, version] = rest
	const { method } = request
	if (!rest.length && method === 'GET') return readPlan(deps, id)
	if (rest.length === 1 && segment === 'status' && method === 'POST')
		return changePlanStatus(deps, request, id)
	const isVersionRead =
		rest.length === VERSION_SEGMENTS &&
		segment === 'versions' &&
		method === 'GET'
	if (!isVersionRead || !version || !VERSION.test(version)) return null
	return readPlanVersion(deps, id, Number(version))
}

// The live plan desks by plan: the desk a plan's page sends the reviewer to. Read off each
// desk's record, not its full summary (a listing would otherwise project every desk's review).
function liveDesksByPlan(hub: Hub): Map<string, PlanDesk> {
	const desks = new Map<string, PlanDesk>()
	for (const desk of hub.listDesks()) {
		const plan = deskPlanId(desk)
		if (plan) desks.set(plan, { id: desk.id, path: deskPagePath(desk.id) })
	}
	return desks
}

function summaryOf(
	record: PlanRecord,
	desks: Map<string, PlanDesk>,
): PlanResponse['plan'] {
	return planSummary(record, desks.get(record.id) ?? null)
}

async function listPlans(deps: PlanRouteDeps): Promise<Response> {
	const desks = liveDesksByPlan(deps.hub)
	const response: PlansResponse = {
		plans: (await deps.plans.list()).map(record =>
			summaryOf(record, desks),
		),
	}
	return json(HTTP_OK, response)
}

async function readPlan(deps: PlanRouteDeps, id: string): Promise<Response> {
	const record = await deps.plans.get(id)
	const latest = record?.versions.at(-1)
	if (!record || !latest) return fail(PLAN_NOT_FOUND)
	const markdown = await deps.plans.readVersion(id, latest.number)
	if (markdown === null) return fail(VERSION_NOT_FOUND)
	const response: PlanResponse = {
		plan: summaryOf(record, liveDesksByPlan(deps.hub)),
		markdown,
	}
	return json(HTTP_OK, response)
}

async function readPlanVersion(
	deps: PlanRouteDeps,
	id: string,
	version: number,
): Promise<Response> {
	const markdown = await deps.plans.readVersion(id, version)
	if (markdown === null) return fail(VERSION_NOT_FOUND)
	const response: PlanVersionResponse = { number: version, markdown }
	return json(HTTP_OK, response)
}

// The reviewer's word on a plan: implemented, archived, or back to draft (PlanStatusRequest).
async function changePlanStatus(
	deps: PlanRouteDeps,
	request: Request,
	id: string,
): Promise<Response> {
	const body: unknown = await readJsonBody(request)
	const status =
		typeof body === 'object' && body !== null && 'status' in body
			? body.status
			: undefined
	if (!isPlanStatusChange(status))
		return fail({
			status: HTTP_UNPROCESSABLE,
			code: 'INVALID_PLAN_STATUS',
			error: 'status must be "draft", "implemented" or "archived".',
			fix: 'POST { status } - a plan is approved by a Send, never by hand.',
		})
	const record = await deps.plans.changeStatus(id, status)
	if (!record) return fail(PLAN_NOT_FOUND)
	return json(HTTP_OK, {
		plan: summaryOf(record, liveDesksByPlan(deps.hub)),
	})
}

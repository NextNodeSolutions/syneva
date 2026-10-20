import { HUB_PATHS, deskPagePath } from '@syneva/contracts/routes'

import { planSummary } from '../../../application/plan-library.js'
import { isPlanStatusChange } from '../../../domain/plan.js'

import { deskPlanId } from './hosted-desk.js'
import {
	HTTP_NOT_FOUND,
	HTTP_OK,
	HTTP_UNPROCESSABLE,
	fail,
	json,
	readJsonBody,
} from './http.js'

import type { IncomingMessage, ServerResponse } from 'node:http'
import type {
	PlanDesk,
	PlanResponse,
	PlansResponse,
	PlanVersionResponse,
} from '@syneva/contracts/plans'
import type { PlanLibrary } from '../../../application/plan-library.js'
import type { PlanRecord } from '../../../domain/plan.js'
import type { ApiFailure } from './failure.js'
import type { Hub } from './hub.js'

export type PlanRouteDeps = { hub: Hub; plans: PlanLibrary }

type PlanRequest = { req: IncomingMessage; res: ServerResponse; url: URL }

// A plan id is the hex digest the hub derives (domain/identity planId); a version is 1-based.
const PLAN_ID = /^[a-f0-9]{8,64}$/
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
// PlanResponse, PlanVersionResponse). False when the path is none of them, so the router goes on.
export async function handlePlanApi(
	deps: PlanRouteDeps,
	request: PlanRequest,
): Promise<boolean> {
	const { req, url } = request
	const { pathname } = url
	if (pathname === HUB_PATHS.plans && req.method === 'GET') {
		await listPlans(deps, request.res)
		return true
	}
	if (!pathname.startsWith(`${HUB_PATHS.plans}/`)) return false
	const [id = '', ...rest] = pathname
		.slice(HUB_PATHS.plans.length + 1)
		.split('/')
	if (!PLAN_ID.test(id)) return false
	return dispatchPlan(deps, request, id, rest)
}

async function dispatchPlan(
	deps: PlanRouteDeps,
	{ req, res }: PlanRequest,
	id: string,
	rest: readonly string[],
): Promise<boolean> {
	const [segment, version] = rest
	if (!rest.length && req.method === 'GET') {
		await readPlan(deps, res, id)
		return true
	}
	if (rest.length === 1 && segment === 'status' && req.method === 'POST') {
		await changePlanStatus(deps, req, res, id)
		return true
	}
	const isVersionRead =
		rest.length === VERSION_SEGMENTS &&
		segment === 'versions' &&
		req.method === 'GET'
	if (!isVersionRead || !version || !VERSION.test(version)) return false
	await readPlanVersion(deps, res, id, Number(version))
	return true
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

async function listPlans(
	deps: PlanRouteDeps,
	res: ServerResponse,
): Promise<void> {
	const desks = liveDesksByPlan(deps.hub)
	const response: PlansResponse = {
		plans: (await deps.plans.list()).map(record =>
			summaryOf(record, desks),
		),
	}
	json(res, HTTP_OK, response)
}

async function readPlan(
	deps: PlanRouteDeps,
	res: ServerResponse,
	id: string,
): Promise<void> {
	const record = await deps.plans.get(id)
	const latest = record?.versions.at(-1)
	if (!record || !latest) return fail(res, PLAN_NOT_FOUND)
	const markdown = await deps.plans.readVersion(id, latest.number)
	if (markdown === null) return fail(res, VERSION_NOT_FOUND)
	const response: PlanResponse = {
		plan: summaryOf(record, liveDesksByPlan(deps.hub)),
		markdown,
	}
	json(res, HTTP_OK, response)
}

async function readPlanVersion(
	deps: PlanRouteDeps,
	res: ServerResponse,
	id: string,
	version: number,
): Promise<void> {
	const markdown = await deps.plans.readVersion(id, version)
	if (markdown === null) return fail(res, VERSION_NOT_FOUND)
	const response: PlanVersionResponse = { number: version, markdown }
	json(res, HTTP_OK, response)
}

// The reviewer's word on a plan: implemented, archived, or back to draft (PlanStatusRequest).
async function changePlanStatus(
	deps: PlanRouteDeps,
	req: IncomingMessage,
	res: ServerResponse,
	id: string,
): Promise<void> {
	const body: unknown = await readJsonBody(req)
	const status =
		typeof body === 'object' && body !== null && 'status' in body
			? body.status
			: undefined
	if (!isPlanStatusChange(status))
		return fail(res, {
			status: HTTP_UNPROCESSABLE,
			code: 'INVALID_PLAN_STATUS',
			error: 'status must be "draft", "implemented" or "archived".',
			fix: 'POST { status } - a plan is approved by a Send, never by hand.',
		})
	const record = await deps.plans.changeStatus(id, status)
	if (!record) return fail(res, PLAN_NOT_FOUND)
	json(res, HTTP_OK, { plan: summaryOf(record, liveDesksByPlan(deps.hub)) })
}

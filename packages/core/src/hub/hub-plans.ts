import { deskPagePath } from '@syneva/contracts/routes'

import { planSummary } from '../application/plan-library.js'

import { deskPlanId } from './hosted-desk.js'

import type { PlanDesk, PlanSummary } from '@syneva/contracts/plans'
import type { PlanRecord } from '../domain/plan.js'
import type { Hub } from './hub.js'

// The live plan desks by plan: the desk a plan's page sends the reviewer to. Read off each
// desk's record, not its full summary (a listing would otherwise project every desk's review).
export function liveDesksByPlan(
	hub: Pick<Hub, 'listDesks'>,
): Map<string, PlanDesk> {
	const desks = new Map<string, PlanDesk>()
	for (const desk of hub.listDesks()) {
		const plan = deskPlanId(desk)
		if (plan) desks.set(plan, { id: desk.id, path: deskPagePath(desk.id) })
	}
	return desks
}

// A plan as the hub lists it: its record, and the live desk reviewing it now, if any.
export function planOnHub(
	record: PlanRecord,
	desks: Map<string, PlanDesk>,
): PlanSummary {
	return planSummary(record, desks.get(record.id) ?? null)
}

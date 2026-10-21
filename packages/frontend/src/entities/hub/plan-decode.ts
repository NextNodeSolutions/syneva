import {
	assertObject,
	enumValue,
	optString,
	requiredArray,
	requiredNumber,
	requiredString,
} from '@shared/api/decode'

import { PLAN_STATUSES } from './plan-model'

import type { Plan, PlanDocument, PlanVersion } from './plan-model'

// Required fields fail loudly with a named boundary error; unknown properties are ignored, so a
// newer hub stays readable.

function decodeVersion(raw: unknown, endpoint: string): PlanVersion {
	const o = assertObject(raw, endpoint, 'plan version')
	return {
		number: requiredNumber(o, 'number', endpoint),
		postedAt: requiredString(o, 'postedAt', endpoint),
		title: requiredString(o, 'title', endpoint),
		approvedAt: optString(o, 'approvedAt', endpoint) ?? null,
	}
}

function decodeDeskPath(raw: unknown, endpoint: string): string | null {
	if (!raw) return null
	return requiredString(
		assertObject(raw, endpoint, 'plan desk'),
		'path',
		endpoint,
	)
}

export function decodePlan(raw: unknown, endpoint: string): Plan {
	const o = assertObject(raw, endpoint, 'plan')
	return {
		id: requiredString(o, 'id', endpoint),
		root: requiredString(o, 'root', endpoint),
		project: requiredString(o, 'project', endpoint),
		projectId: requiredString(o, 'projectId', endpoint),
		path: requiredString(o, 'path', endpoint),
		title: requiredString(o, 'title', endpoint),
		summary: optString(o, 'summary', endpoint) ?? null,
		status: enumValue(o.status, endpoint, PLAN_STATUSES, 'plan.status'),
		versions: requiredArray(o, 'versions', endpoint).map(version =>
			decodeVersion(version, endpoint),
		),
		createdAt: requiredString(o, 'createdAt', endpoint),
		updatedAt: requiredString(o, 'updatedAt', endpoint),
		deskPath: decodeDeskPath(o.desk, endpoint),
	}
}

export function decodePlans(raw: unknown, endpoint: string): Plan[] {
	const o = assertObject(raw, endpoint, 'plan listing')
	return requiredArray(o, 'plans', endpoint).map(plan =>
		decodePlan(plan, endpoint),
	)
}

export function decodePlanDocument(
	raw: unknown,
	endpoint: string,
): PlanDocument {
	const o = assertObject(raw, endpoint, 'plan document')
	return {
		plan: decodePlan(o.plan, endpoint),
		markdown: requiredString(o, 'markdown', endpoint),
	}
}

export function decodeMarkdown(raw: unknown, endpoint: string): string {
	return requiredString(
		assertObject(raw, endpoint, 'plan version'),
		'markdown',
		endpoint,
	)
}

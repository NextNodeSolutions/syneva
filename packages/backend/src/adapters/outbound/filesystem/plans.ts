import { promises as fs } from 'node:fs'
import path from 'node:path'

import { decodePlanRecord } from '../../../domain/plan.js'

import { hubDir } from './hub.js'
import { writeFileAtomic } from './persistence.js'

import type { PlanStorePort } from '../../../application/ports.js'
import type { PlanRecord } from '../../../domain/plan.js'

// The plan library lives beside the rest of the hub's own state: one folder per plan, its
// record and each version as it was posted.
const PLANS_DIR = 'plans'
const RECORD_FILE = 'plan.json'
const JSON_INDENT = 2
// Ids are the hub's own hex digests; anything else must never reach a path.
const PLAN_ID = /^[a-f0-9]{8,64}$/

function plansDir(): string {
	return path.join(hubDir(), PLANS_DIR)
}

function planDir(id: string): string {
	if (!PLAN_ID.test(id)) throw new Error(`Not a plan id: ${id}`)
	return path.join(plansDir(), id)
}

function versionFile(id: string, version: number): string {
	return path.join(planDir(id), `v${String(version)}.md`)
}

function isMissing(error: unknown): boolean {
	return (
		typeof error === 'object' &&
		error !== null &&
		'code' in error &&
		error.code === 'ENOENT'
	)
}

async function loadPlans(): Promise<PlanRecord[]> {
	let ids: string[]
	try {
		ids = await fs.readdir(plansDir())
	} catch (error) {
		if (isMissing(error)) return [] // no plan yet
		throw error
	}
	const records = await Promise.all(
		ids.filter(id => PLAN_ID.test(id)).map(loadPlan),
	)
	return records.filter(record => record !== null)
}

// A record that does not decode is left on disk and out of the library: a foreign or torn file
// costs that plan's listing, never the library's.
async function loadPlan(id: string): Promise<PlanRecord | null> {
	try {
		const text = await fs.readFile(
			path.join(planDir(id), RECORD_FILE),
			'utf8',
		)
		const parsed: unknown = JSON.parse(text)
		const record = decodePlanRecord(parsed)
		if (record?.id !== id) return null
		return record
	} catch {
		return null
	}
}

async function savePlan(record: PlanRecord): Promise<void> {
	const dir = planDir(record.id)
	await fs.mkdir(dir, { recursive: true })
	await writeFileAtomic(
		path.join(dir, RECORD_FILE),
		`${JSON.stringify(record, null, JSON_INDENT)}\n`,
	)
}

async function writeVersion(
	id: string,
	version: number,
	markdown: string,
): Promise<void> {
	await fs.mkdir(planDir(id), { recursive: true })
	await writeFileAtomic(versionFile(id, version), markdown)
}

async function readVersion(
	id: string,
	version: number,
): Promise<string | null> {
	try {
		return await fs.readFile(versionFile(id, version), 'utf8')
	} catch (error) {
		if (isMissing(error)) return null
		throw error
	}
}

// The node/filesystem implementation of the application's plan-store capability. Frozen like
// the registry's and the journal's.
export const nodePlanStore: PlanStorePort = Object.freeze({
	load: loadPlans,
	save: savePlan,
	writeVersion,
	readVersion,
})

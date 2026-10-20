// A plan in the hub's plan library (RFC 0002): every version a plan desk posted, and where its
// review stands. The record grows by versions and a status and is never edited: the text is
// always a file someone wrote. Like the journal (hub-journal.ts), the persisted record is decoded
// field by field before anything trusts it.
//
// PlanRecord is a structural mirror of packages/contracts/src/plans.ts (domain may not import
// contracts): the application maps one onto the other (application/plan-library.ts).

import { nonEmptyString, optionalString } from './hub-registry.js'
import { markdownOutline } from './outline-markdown.js'

export type PlanStatus = 'draft' | 'approved' | 'implemented' | 'archived'

// What the reviewer may set by hand: approval only ever comes from a Send.
export type PlanStatusChange = 'draft' | 'implemented' | 'archived'

export type PlanVersion = {
	readonly number: number
	// The content's digest: the same content never makes a second version.
	readonly contentHash: string
	readonly postedAt: string
	readonly title: string
	readonly approvedAt?: string | undefined
}

export type PlanRecord = {
	readonly id: string
	readonly root: string
	// The plan file, relative to the root.
	readonly path: string
	readonly title: string
	readonly summary?: string | undefined
	readonly status: PlanStatus
	readonly versions: readonly PlanVersion[]
	// The desk that last posted a version: the plan's page reviews it there.
	readonly deskId: string
	readonly createdAt: string
	readonly updatedAt: string
}

// One version as a plan desk posts it: the file's text as the reviewer is about to see it.
export type PlanPosting = {
	readonly id: string
	readonly root: string
	readonly path: string
	readonly deskId: string
	readonly markdown: string
	readonly contentHash: string
	readonly at: string
}

export type PlanHeading = { title: string; summary?: string | undefined }

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/
const FRONT_MATTER_FIELD = /^([A-Za-z_][\w-]*)\s*:\s*(.*)$/
const QUOTED = /^(["'])(?<inner>.*)\1$/

// The name a plan goes by: its front matter's `title` and `summary`, else its first heading,
// else the file's own name. Only the leading block counts as front matter, as in every
// renderer that honors one.
export function planHeading(markdown: string, fileName: string): PlanHeading {
	const fields = frontMatterOf(markdown)
	const title =
		fields.get('title') ??
		markdownOutline(markdown).declarations[0]?.name ??
		fileName
	return { title, summary: fields.get('summary') }
}

// The text a reader sees under the front matter (the block itself is metadata, not prose).
export function planBody(markdown: string): string {
	return markdown.replace(FRONT_MATTER, '')
}

function frontMatterOf(markdown: string): Map<string, string> {
	const fields = new Map<string, string>()
	const block = FRONT_MATTER.exec(markdown)?.[1]
	if (!block) return fields
	for (const line of block.split(/\r?\n/)) {
		const [, key, raw] = FRONT_MATTER_FIELD.exec(line.trim()) ?? []
		const text = unquoted(raw?.trim() ?? '')
		if (key && text) fields.set(key, text)
	}
	return fields
}

function unquoted(text: string): string {
	return QUOTED.exec(text)?.groups?.inner ?? text
}

// A posted version joins the record when its content changed; the same content posts nothing
// (null), whichever desk posted it. A new version is a draft again whatever the plan was: it is
// text the reviewer has not judged, and someone is working on the plan once more.
export function postPlanVersion(
	record: PlanRecord | null,
	posting: PlanPosting,
	fileName: string,
): PlanRecord | null {
	const latest = record?.versions.at(-1)
	if (latest?.contentHash === posting.contentHash) return null
	const heading = planHeading(posting.markdown, fileName)
	const version: PlanVersion = {
		number: (latest?.number ?? 0) + 1,
		contentHash: posting.contentHash,
		postedAt: posting.at,
		title: heading.title,
	}
	return {
		id: posting.id,
		root: posting.root,
		path: posting.path,
		title: heading.title,
		summary: heading.summary,
		status: 'draft',
		versions: [...(record?.versions ?? []), version],
		deskId: posting.deskId,
		createdAt: record?.createdAt ?? posting.at,
		updatedAt: posting.at,
	}
}

// A Send that approved the plan's file approves its latest version: the one the reviewer read
// (a version posts when its desk opens or reloads, before anything is sent). An implemented plan
// stays implemented; a version already approved is left as it was (null: nothing changed).
export function approvePlan(record: PlanRecord, at: string): PlanRecord | null {
	const latest = record.versions.at(-1)
	if (!latest || latest.approvedAt) return null
	return {
		...record,
		status: record.status === 'implemented' ? 'implemented' : 'approved',
		versions: [
			...record.versions.slice(0, -1),
			{ ...latest, approvedAt: at },
		],
		updatedAt: at,
	}
}

// The reviewer's own word on the plan. Back to draft reads the latest version again: approved
// when a Send approved it, a draft otherwise.
export function changePlanStatus(
	record: PlanRecord,
	change: PlanStatusChange,
	at: string,
): PlanRecord {
	const status =
		change === 'draft' && record.versions.at(-1)?.approvedAt
			? 'approved'
			: change
	return { ...record, status, updatedAt: at }
}

export function isPlanStatusChange(raw: unknown): raw is PlanStatusChange {
	return raw === 'draft' || raw === 'implemented' || raw === 'archived'
}

function isPlanStatus(raw: unknown): raw is PlanStatus {
	return raw === 'approved' || isPlanStatusChange(raw)
}

// null when it is not a complete record: a plan whose versions cannot be read is dropped rather
// than half-listed.
export function decodePlanRecord(raw: unknown): PlanRecord | null {
	const record = recordOf(raw)
	if (!record) return null
	const id = nonEmptyString(record.id)
	const root = nonEmptyString(record.root)
	const path = nonEmptyString(record.path)
	const title = nonEmptyString(record.title)
	const deskId = nonEmptyString(record.deskId)
	const createdAt = nonEmptyString(record.createdAt)
	const updatedAt = nonEmptyString(record.updatedAt)
	const versions = decodeVersions(record.versions)
	if (!id || !root || !path || !title || !deskId || !createdAt || !updatedAt)
		return null
	if (!versions?.length || !isPlanStatus(record.status)) return null
	return {
		id,
		root,
		path,
		title,
		summary: optionalString(record.summary),
		status: record.status,
		versions,
		deskId,
		createdAt,
		updatedAt,
	}
}

// Every version must read, numbered 1..n in order: a gap would make "the latest version" and
// its file disagree.
function decodeVersions(raw: unknown): PlanVersion[] | null {
	if (!Array.isArray(raw)) return null
	const versions: PlanVersion[] = []
	for (const [index, entry] of raw.entries()) {
		const version = decodeVersion(entry)
		if (version?.number !== index + 1) return null
		versions.push(version)
	}
	return versions
}

function decodeVersion(raw: unknown): PlanVersion | null {
	const record = recordOf(raw)
	if (!record) return null
	const { number } = record
	const contentHash = nonEmptyString(record.contentHash)
	const postedAt = nonEmptyString(record.postedAt)
	const title = nonEmptyString(record.title)
	if (typeof number !== 'number' || !Number.isInteger(number)) return null
	if (!contentHash || !postedAt || !title) return null
	return {
		number,
		contentHash,
		postedAt,
		title,
		approvedAt: optionalString(record.approvedAt),
	}
}

function recordOf(raw: unknown): Record<string, unknown> | null {
	if (typeof raw !== 'object' || raw === null) return null
	return Object.fromEntries(Object.entries(raw))
}

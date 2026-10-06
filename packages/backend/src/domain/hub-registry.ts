// Persisted data whose bytes must be shaped field by field before anything trusts them - an unchecked cast would let a malformed or foreign file resurrect a desk on a wrong path, or point the CLI at an unintended URL.

import type { ReviewMode } from './review.js'

// Review state itself lives in the per-session review files and is merged back on rebuild.
export type HubDeskRecord = {
	readonly id: string
	readonly root: string
	readonly session: string
	readonly mode: ReviewMode
	readonly target?: string | undefined
	readonly base?: string | undefined
	readonly staged: boolean
	readonly pathFilter?: string | undefined
	readonly openedAt: string
}

export type HubLock = {
	readonly pid: number
	readonly url: string
	readonly startedAt: string
	readonly version: string
}

// The field readers every hub record decode shares (the journal's too, hub-journal.ts).
export function isMode(raw: unknown): raw is ReviewMode {
	return raw === 'repo' || raw === 'file' || raw === 'pr'
}

export function nonEmptyString(raw: unknown): string | null {
	if (typeof raw !== 'string' || !raw.length) return null
	return raw
}

export function optionalString(raw: unknown): string | undefined {
	if (typeof raw !== 'string' || !raw.length) return undefined
	return raw
}

// null when it is not a complete record: a desk that cannot be rebuilt from its own parameters is dropped rather than half-restored.
export function decodeHubDeskRecord(raw: unknown): HubDeskRecord | null {
	if (typeof raw !== 'object' || raw === null) return null
	const record: Record<string, unknown> = Object.fromEntries(
		Object.entries(raw),
	)
	const id = nonEmptyString(record.id)
	const root = nonEmptyString(record.root)
	const session = nonEmptyString(record.session)
	const openedAt = nonEmptyString(record.openedAt)
	if (!id || !root || !session || !openedAt || !isMode(record.mode))
		return null
	return {
		id,
		root,
		session,
		mode: record.mode,
		target: optionalString(record.target),
		base: optionalString(record.base),
		staged: record.staged === true,
		pathFilter: optionalString(record.pathFilter),
		openedAt,
	}
}

export function decodeHubRegistry(raw: unknown): HubDeskRecord[] {
	if (typeof raw !== 'object' || raw === null || !('desks' in raw)) return []
	const { desks } = raw
	if (!Array.isArray(desks)) return []
	const records: HubDeskRecord[] = []
	for (const entry of desks) {
		const decoded = decodeHubDeskRecord(entry)
		if (decoded) records.push(decoded)
	}
	return records
}

// A truthy url alone proves nothing - the pid must be a positive integer and the strings present, so a corrupt lock degrades to "no hub recorded" (the CLI then probes the default origin) rather than to a half-valid one.
export function decodeHubLock(raw: unknown): HubLock | null {
	if (typeof raw !== 'object' || raw === null) return null
	const record: Record<string, unknown> = Object.fromEntries(
		Object.entries(raw),
	)
	const { pid } = record
	if (typeof pid !== 'number' || !Number.isInteger(pid) || pid <= 0)
		return null
	const url = nonEmptyString(record.url)
	const startedAt = nonEmptyString(record.startedAt)
	if (!url || !startedAt) return null
	return {
		pid,
		url,
		startedAt,
		version: typeof record.version === 'string' ? record.version : '',
	}
}

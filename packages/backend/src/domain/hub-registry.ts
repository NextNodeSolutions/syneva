// The hub's persisted records (~/.syneva/hub/): the desk registry the hub restores from after
// a restart, and the hub lock the CLI reads to find a running hub. Domain owns the shapes and
// their decode: like the review records, they are persisted data whose bytes must be shaped
// field by field before anything trusts them - an unchecked cast would let a malformed or
// foreign file resurrect a desk on a wrong path, or point the CLI at an unintended URL.

import type { ReviewMode } from './review.js'

// Everything the hub needs to rebuild a desk it hosted before: the rebuild parameters of its
// review (the same ones a reload uses) plus when it was first opened. Review state itself is
// not here - it lives in the per-session review files and is merged back on rebuild.
export type HubDeskRecord = {
	readonly id: string
	readonly root: string
	readonly session: string
	readonly mode: ReviewMode
	readonly target?: string | undefined
	readonly base?: string | undefined
	readonly staged: boolean
	// The repo-mode `--path` limit, which the review state does not carry.
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

// One registry entry, or null when it is not a complete record: a desk that cannot be
// rebuilt from its own parameters is dropped rather than half-restored.
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

// The whole registry file: `{ desks: [...] }`. Malformed entries are skipped, a malformed
// file reads as an empty registry (the hub starts with no desks rather than refusing to start).
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

// The hub lock: a complete, well-formed record or nothing. A truthy url alone proves nothing -
// the pid must be a positive integer and the strings present, so a corrupt lock degrades to
// "no hub recorded" (the CLI then probes the default origin) rather than to a half-valid one.
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

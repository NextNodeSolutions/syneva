// The hub registry record of a desk and its two readings: the record a fresh open writes, and
// the query a restart rebuilds from. Kept beside the hub so the rebuild parameters are written
// and read by the same rule.
import { nowIso } from '../../../application/time.js'

import type { DeskIdentity, DeskQuery } from '../../../application/open-desk.js'
import type { HubDeskRecord } from '../../../domain/hub-registry.js'

// The registry entry of a freshly opened desk: exactly the parameters its rebuild needs.
export function recordOf(
	identity: DeskIdentity,
	query: DeskQuery,
): HubDeskRecord {
	return {
		id: identity.id,
		root: identity.root,
		session: identity.session,
		mode: query.mode,
		target: identity.target,
		base: identity.base,
		staged: query.staged,
		pathFilter: query.pathFilter,
		openedAt: nowIso(),
	}
}

export function queryOf(record: HubDeskRecord): DeskQuery {
	return {
		root: record.root,
		mode: record.mode,
		session: record.session,
		target: record.target,
		base: record.base,
		staged: record.staged,
		pathFilter: record.pathFilter,
	}
}

// Same id, same source? The session already encodes the file (file mode) and the head (pr
// mode), so only a repo desk can be asked for a different source under its own id.
export function sameSource(record: HubDeskRecord, query: DeskQuery): boolean {
	return (
		record.mode === query.mode &&
		record.staged === query.staged &&
		(record.pathFilter ?? '') === (query.pathFilter ?? '')
	)
}

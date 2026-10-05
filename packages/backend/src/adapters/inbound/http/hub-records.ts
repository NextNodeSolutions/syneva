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

// Same id, same source? Only the default session encodes the file (file mode) or the head (pr
// mode): under a session the reviewer named, another file or branch reaches the same id, so
// the target is compared too - as resolved (the absolute file, the PR's head branch), which is
// what the record holds. A different source replaces the desk; the same one reloads it.
export function sameSource(
	record: HubDeskRecord,
	query: DeskQuery,
	identity: Pick<DeskIdentity, 'target'>,
): boolean {
	return (
		record.mode === query.mode &&
		record.staged === query.staged &&
		(record.pathFilter ?? '') === (query.pathFilter ?? '') &&
		(record.target ?? '') === (identity.target ?? '')
	)
}

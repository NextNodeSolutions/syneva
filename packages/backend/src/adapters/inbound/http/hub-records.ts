// The record a fresh open writes, and the query a restart rebuilds from - kept beside the hub so the rebuild parameters are written and read by the same rule.
import { nowIso } from '../../../application/time.js'

import type { DeskIdentity, DeskQuery } from '../../../application/open-desk.js'
import type { HubDeskRecord } from '../../../domain/hub-registry.js'

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

// Only the default session encodes the source (the file or the head): under a named session another file or branch reaches the same desk id, so the target is compared too, as resolved.
// A different source replaces the desk, the same one reloads it.
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

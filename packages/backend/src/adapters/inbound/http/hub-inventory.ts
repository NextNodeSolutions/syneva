import {
	buildSourceState,
	resolveDeskIdentity,
	rootProblem,
} from '../../../application/open-desk.js'
import { buildInventory } from '../../../domain/inventory.js'

import type { DeskQuery } from '../../../application/open-desk.js'
import type { HubState, InventoryOutcome } from './hub.js'

export // Same resolution as an open (a PR head is fetched and read by ref, never checked out), then the inventory of a state built on the spot, even when a live desk reviews that source: an open or a reload rebuilds the diff before it attaches a guide, so an inventory taken from the desk's last round would carry a fingerprint the rebuild refuses as soon as the repo moved.
async function inventoryOf(
	state: HubState,
	query: DeskQuery,
): Promise<InventoryOutcome> {
	const problem = await rootProblem(query, state.io.git)
	if (problem) return { ok: false, code: 'NO_REPOSITORY', reason: problem }
	const resolved = await resolveDeskIdentity(query, state.io.git)
	if (!resolved.ok)
		return { ok: false, code: 'PR_TARGET', reason: resolved.reason }
	const built = await buildSourceState(resolved.identity, query, state.io.git)
	if (!built.ok) return { ok: false, code: 'NO_REVIEW', reason: built.reason }
	return {
		ok: true,
		inventory: buildInventory(built.state, query.pathFilter),
	}
}

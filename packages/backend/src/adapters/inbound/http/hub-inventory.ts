import {
	buildSourceState,
	resolveDeskIdentity,
	rootProblem,
} from '../../../application/open-desk.js'
import { buildInventory } from '../../../domain/inventory.js'

import { liveDesk } from './hub-desks.js'
import { sameSource } from './hub-records.js'

import type { DeskQuery } from '../../../application/open-desk.js'
import type { HubState, InventoryOutcome } from './hub.js'

export // Same resolution as an open (a PR head is fetched and read by ref, never checked out), then the inventory of the live desk's state or of a state built on the spot.
async function inventoryOf(
	state: HubState,
	query: DeskQuery,
): Promise<InventoryOutcome> {
	const problem = await rootProblem(query, state.io.git)
	if (problem) return { ok: false, code: 'NO_REPOSITORY', reason: problem }
	const resolved = await resolveDeskIdentity(query, state.io.git)
	if (!resolved.ok)
		return { ok: false, code: 'PR_TARGET', reason: resolved.reason }
	const { identity } = resolved
	const live = liveDesk(state.desks, identity.id)
	if (live && sameSource(live.record, query, identity))
		return {
			ok: true,
			inventory: buildInventory(live.ctx.state, live.ctx.pathFilter),
		}
	const built = await buildSourceState(identity, query, state.io.git)
	if (!built.ok) return { ok: false, code: 'NO_REVIEW', reason: built.reason }
	return {
		ok: true,
		inventory: buildInventory(built.state, query.pathFilter),
	}
}

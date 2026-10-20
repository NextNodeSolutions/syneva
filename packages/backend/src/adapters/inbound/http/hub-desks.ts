// The live desks among the hub's map: a closing desk is already gone to every caller (its routes answer 404 after the grace), and only live ones are written to the registry.
import { reopenedRecord } from './hub-records.js'

import type { DeskQuery } from '../../../application/open-desk.js'
import type { HubDeskRecord } from '../../../domain/hub-registry.js'
import type { HubDesk } from './hosted-desk.js'

export function liveDesk(
	desks: Map<string, HubDesk>,
	id: string,
): HubDesk | undefined {
	const desk = desks.get(id)
	if (!desk || desk.closing) return undefined
	return desk
}

export function liveRecords(desks: Map<string, HubDesk>): HubDeskRecord[] {
	return [...desks.values()]
		.filter(desk => !desk.closing)
		.map(desk => desk.record)
}

// The record is what a restart rebuilds from: a reopen that changed the guide expectation, or
// made the desk a plan desk, must outlive the hub too.
export async function keepOpenPreferences(
	desks: Map<string, HubDesk>,
	id: string,
	query: DeskQuery,
	persist: () => Promise<void>,
): Promise<void> {
	const desk = desks.get(id)
	if (!desk) return
	const record = reopenedRecord(desk.record, query)
	if (record === desk.record) return
	desk.record = record
	await persist()
}

// The live desks among the hub's map: a closing desk is already gone to every caller (its routes answer 404 after the grace), and only live ones are written to the registry.
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

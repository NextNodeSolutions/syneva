import type { HeldStatus, HubStatus } from './link'

// Apart from link.ts, which reads close codes: the desk's eager chrome asks only this.
const HELD: ReadonlySet<HubStatus> = new Set<HeldStatus>([
	'unreachable',
	'too-many',
	'saturated',
])

export function isHeldOff(status: HubStatus): status is HeldStatus {
	return HELD.has(status)
}

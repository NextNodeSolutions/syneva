import { stageCounts } from '@entities/hub/stage'

import type { HubDesk } from '@entities/hub/model'
import type { StageCounts } from '@entities/hub/stage'
import type { HubView } from '@entities/hub/use-hub'

// What the page can say about the hub, from how it last answered: nothing yet; this browser
// is signed out (the listing is hidden, whatever was listed before); the hub never answered;
// or a listing (stale while the hub is not answering, every pulse then off).
export type HubPhase =
	| { kind: 'loading' }
	| { kind: 'signed-out' }
	| { kind: 'unreachable' }
	| {
			kind: 'listed'
			desks: HubDesk[]
			counts: StageCounts
			isStale: boolean
	  }

export function hubPhase({
	status,
	desks,
}: Pick<HubView, 'status' | 'desks'>): HubPhase {
	if (status === 'signed-out') return { kind: 'signed-out' }
	if (!desks)
		return { kind: status === 'unreachable' ? 'unreachable' : 'loading' }
	return {
		kind: 'listed',
		desks,
		counts: stageCounts(desks),
		isStale: status === 'unreachable',
	}
}

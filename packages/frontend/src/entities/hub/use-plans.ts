import { useSyncExternalStore } from 'react'

import { hubStatus } from './link'
import { hubView, subscribeHub } from './stream'

import type { HubStatus } from './link'
import type { Plan } from './plan-model'

export type PlansView =
	| { phase: 'loading' }
	| { phase: 'failed' }
	| { phase: 'read'; plans: Plan[] }

const REACHING: ReadonlySet<HubStatus> = new Set(['connecting', 'live'])

function readPlans(): Plan[] | null {
	return hubView().plans
}

// The plan library as the hub's stream keeps it: whole with each snapshot, then one `plan` frame
// per plan that moved. Only a library never read, on a hub that does not answer, reads as failed.
export function usePlans(): PlansView {
	const plans = useSyncExternalStore(subscribeHub, readPlans)
	const stream = useSyncExternalStore(subscribeHub, () => hubView().stream)
	if (plans) return { phase: 'read', plans }
	return { phase: REACHING.has(hubStatus(stream)) ? 'loading' : 'failed' }
}

import { useEffect, useState } from 'react'

import { fetchPlans } from './api'
import { planSignature } from './plan-model'
import { pollWhileVisible, READ_TIMEOUT_MS } from './poll'

import type { Plan } from './plan-model'

export type PlansView =
	| { phase: 'loading' }
	| { phase: 'failed' }
	| { phase: 'read'; plans: Plan[] }

type Keep = (update: (held: PlansView) => PlansView) => void

// Two reads of the library are the same for the page when every plan reads the same, in the
// same order.
function signature(plans: readonly Plan[]): string {
	return plans.map(planSignature).join('\n')
}

// A read that changed nothing keeps the view held, so the page does not render again.
function adopted(held: PlansView, plans: Plan[]): PlansView {
	if (held.phase === 'read' && signature(held.plans) === signature(plans))
		return held
	return { phase: 'read', plans }
}

// Follow the library on the listing's cadence; a failed read keeps what was read, and only a
// library never read reads as failed.
function followPlans(keep: Keep): () => void {
	return pollWhileVisible(async () => {
		try {
			const plans = await fetchPlans(AbortSignal.timeout(READ_TIMEOUT_MS))
			keep(held => adopted(held, plans))
		} catch {
			keep(held => (held.phase === 'read' ? held : { phase: 'failed' }))
		}
	})
}

export function usePlans(): PlansView {
	const [view, setView] = useState<PlansView>({ phase: 'loading' })
	// oxlint-disable-next-line nextnode/no-use-effect -- polls the hub over HTTP on a timer: an external system
	useEffect(() => followPlans(setView), [])
	return view
}

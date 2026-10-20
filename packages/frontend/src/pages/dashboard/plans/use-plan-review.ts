import { useState } from 'react'

import { hubRefusal, openHubDesk } from '@entities/hub/api'

import type { Plan } from '@entities/hub/plan-model'

export type PlanReview = {
	busy: boolean
	failure: string | null
	review: () => Promise<void>
}

function failureOf(error: unknown): string {
	const refusal = hubRefusal(error)
	if (refusal.kind === 'refused') return refusal.reason
	if (refusal.kind === 'signed-out') return 'This browser is signed out.'
	return 'The hub did not answer.'
}

// A plan whose desk closed is reviewed again on the same desk: the hub opens the file as a plan
// from the same absolute path the CLI gave it, so the desk's id and session come out the same
// and its saved review merges back; then the page goes to it.
export function usePlanReview(plan: Plan): PlanReview {
	const [busy, setBusy] = useState(false)
	const [failure, setFailure] = useState<string | null>(null)
	const review = async (): Promise<void> => {
		setBusy(true)
		setFailure(null)
		try {
			const desk = await openHubDesk({
				root: plan.root,
				mode: 'file',
				staged: false,
				target: `${plan.root}/${plan.path}`,
				plan: true,
			})
			window.location.assign(desk.path)
		} catch (error) {
			setFailure(failureOf(error))
			setBusy(false)
		}
	}
	return { busy, failure, review }
}

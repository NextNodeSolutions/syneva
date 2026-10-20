import { useEffect, useState } from 'react'

import { ApiError } from '@shared/api/client'

import { fetchPlan } from './api'
import { planSignature } from './plan-model'
import { pollWhileVisible, READ_TIMEOUT_MS } from './poll'

import type { Plan, PlanDocument } from './plan-model'

export type PlanView =
	| { phase: 'loading' }
	| { phase: 'missing' }
	| { phase: 'failed' }
	| { phase: 'read'; document: PlanDocument }

type Keep = (update: (held: PlanView) => PlanView) => void

const NOT_FOUND = 404

// A read that changed nothing keeps the view held: the markdown only changes with a new
// version, which moves the plan's signature.
function adopted(held: PlanView, document: PlanDocument): PlanView {
	if (
		held.phase === 'read' &&
		planSignature(held.document.plan) === planSignature(document.plan)
	)
		return held
	return { phase: 'read', document }
}

function unread(held: PlanView, error: unknown): PlanView {
	if (error instanceof ApiError && error.status === NOT_FOUND)
		return { phase: 'missing' }
	return held.phase === 'read' ? held : { phase: 'failed' }
}

// Follow one plan on the listing's cadence, so a version the agent posts or an approval the
// reviewer sends from the desk shows on its page without a reload.
function followPlan(id: string, keep: Keep): () => void {
	return pollWhileVisible(async () => {
		try {
			const document = await fetchPlan(
				id,
				AbortSignal.timeout(READ_TIMEOUT_MS),
			)
			keep(held => adopted(held, document))
		} catch (error) {
			keep(held => unread(held, error))
		}
	})
}

export type PlanFollow = {
	view: PlanView
	// The plan as a status change answered it, adopted at once rather than on the next read.
	adopt: (plan: Plan) => void
}

export function usePlan(id: string): PlanFollow {
	const [view, setView] = useState<PlanView>({ phase: 'loading' })
	// oxlint-disable-next-line nextnode/no-use-effect -- polls the hub over HTTP on a timer: an external system
	useEffect(() => followPlan(id, setView), [id])
	const adopt = (plan: Plan): void =>
		setView(held =>
			held.phase === 'read'
				? { phase: 'read', document: { ...held.document, plan } }
				: held,
		)
	return { view, adopt }
}

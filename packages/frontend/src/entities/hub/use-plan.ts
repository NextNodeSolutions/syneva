import { useEffect, useState } from 'react'

import { fetchPlan } from './api'
import { latestVersion } from './plan-model'
import { adoptPlan, onHubHello } from './stream'
import { usePlans } from './use-plans'

import type { Plan, PlanDocument } from './plan-model'
import type { PlansView } from './use-plans'

export type PlanView =
	| { phase: 'loading' }
	| { phase: 'missing' }
	| { phase: 'failed' }
	| { phase: 'read'; document: PlanDocument }

export type PlanFollow = {
	view: PlanView
	// The plan as a status change answered it, adopted at once rather than with its frame.
	adopt: (plan: Plan) => void
}

// The plan's latest text as the page last read it (for the version its record named then), or
// why it has none.
type TextRead =
	| { id: string; version: number; kind: 'text'; markdown: string }
	| { id: string; kind: 'gone' }
	| { id: string; kind: 'failed' }

type TextTarget = { id: string; version: number }

type Keep = (update: (held: TextRead | null) => TextRead) => void

// The plan's latest text, read now and again each time the hub says hello again (a read it left
// unanswered, a version posted while the tab was away). A read that failed keeps a text already
// read. Returns the teardown.
function followText({ id, version }: TextTarget, keep: Keep): () => void {
	let isCurrent = true
	const read = async (): Promise<void> => {
		try {
			const document = await fetchPlan(id)
			if (!isCurrent) return
			keep(() =>
				document
					? { id, version, kind: 'text', markdown: document.markdown }
					: { id, kind: 'gone' },
			)
		} catch {
			if (!isCurrent) return
			keep(held =>
				held?.kind === 'text' && held.id === id
					? held
					: { id, kind: 'failed' },
			)
		}
	}
	void read()
	const stopFollowing = onHubHello(() => {
		void read()
	})
	return (): void => {
		isCurrent = false
		stopFollowing()
	}
}

// The record comes from the stream (its `plan` frames); its text is read when the page opens it,
// when a frame moves it to a new version, and when the hub says hello again, never on a timer.
function useLatestText(id: string, version: number | null): TextRead | null {
	const [text, setText] = useState<TextRead | null>(null)
	// oxlint-disable-next-line nextnode/no-use-effect -- reads the plan's text over HTTP as the hub's stream moves it: an external system
	useEffect(() => {
		if (version === null) return undefined
		return followText({ id, version }, setText)
	}, [id, version])
	if (text?.id !== id) return null
	return text
}

function planView(
	library: PlansView,
	plan: Plan | undefined,
	text: TextRead | null,
): PlanView {
	if (library.phase !== 'read') return { phase: library.phase }
	if (!plan || text?.kind === 'gone') return { phase: 'missing' }
	if (!text) return { phase: 'loading' }
	if (text.kind === 'failed') return { phase: 'failed' }
	return { phase: 'read', document: { plan, markdown: text.markdown } }
}

export function usePlan(id: string): PlanFollow {
	const library = usePlans()
	const plan =
		library.phase === 'read'
			? library.plans.find(each => each.id === id)
			: undefined
	const version = plan ? (latestVersion(plan)?.number ?? 0) : null
	const text = useLatestText(id, version)
	return { view: planView(library, plan, text), adopt: adoptPlan }
}

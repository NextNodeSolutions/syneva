import { useCallback, useState } from 'react'

import { closeHubDesk, hubRefusal } from '@entities/hub/api'

import { focusAfterClose } from './focus-after-close'
import { deskCloseId, deskKeepId } from './focus-targets'
import { useArmedDesk } from './use-armed-desk'
import { useEscapeToDisarm } from './use-escape-to-disarm'
import { useFocusNext } from './use-focus-next'

import type { HubDesk, HubProject } from '@entities/hub/model'
import type { CloseOutcome } from './use-close-notice'

// Where a desk's close stands: at rest, armed (asking for the second, deliberate click), or
// closing (the hub is closing it).
export type CloseState = 'rest' | 'armed' | 'closing'

export type CloseActions = {
	arm: () => void
	// Back to rest, focus on Close (Keep).
	keep: () => void
	// Back to rest where focus already went (it left the pair).
	release: () => void
	confirm: () => void
}

export type DeskClose = {
	// A close is armed somewhere on the page: N then opens nothing (the reviewer is mid-decision).
	isArmed: boolean
	// A close is armed or under way, its row not yet handed focus on: the listing's order holds
	// still, or the rows would take a fresh order in the render the closed one leaves - under a
	// keyboard user whose focus fell with the busy control and has not landed again yet.
	isHolding: boolean
	stateOf: (deskId: string) => CloseState
	// `projects`: the rows as displayed, for where focus goes once this row leaves.
	actionsFor: (desk: HubDesk, projects: readonly HubProject[]) => CloseActions
}

type DeskCloseDeps = {
	// The desks listed now: an armed desk that left the listing is armed no more.
	desks: readonly HubDesk[]
	report: (outcome: CloseOutcome) => void
	refresh: () => Promise<void>
}

const NONE: ReadonlySet<string> = new Set()

// The desks whose close is under way - from the confirm until their row has handed focus on.
function useClosingIds(): {
	closingIds: ReadonlySet<string>
	begin: (deskId: string) => void
	settle: (deskId: string) => void
} {
	const [closingIds, setClosingIds] = useState(NONE)
	return {
		closingIds,
		begin: deskId => setClosingIds(ids => new Set([...ids, deskId])),
		settle: deskId =>
			setClosingIds(ids => new Set([...ids].filter(id => id !== deskId))),
	}
}

// Ask the hub to close the desk and say how it went: closed (and whether an agent was there
// to be told), already gone, or not done and why.
async function closeOutcome(desk: HubDesk): Promise<CloseOutcome> {
	const { session } = desk
	try {
		if (!(await closeHubDesk(desk.id)))
			return { result: 'already-closed', session }
		return {
			result: 'closed',
			session,
			wasAgentListening: desk.agentListening,
		}
	} catch (error) {
		const refusal = hubRefusal(error)
		const cause =
			refusal.kind === 'aborted'
				? { kind: 'unreachable' as const }
				: refusal
		return { result: 'failed', session, cause }
	}
}

// The listing's closes: one armed at a time, confirmed by a second click, then reported and
// the listing re-read; several may be closing at once. Focus follows each step - to Keep when
// armed, back to Close when kept or refused, to the neighbouring row once the row has left.
export function useDeskClose({
	desks,
	report,
	refresh,
}: DeskCloseDeps): DeskClose {
	const { armedId, arm, disarm } = useArmedDesk(desks)
	const { closingIds, begin, settle } = useClosingIds()
	const focusNext = useFocusNext()

	const keep = useCallback(
		(deskId: string): void => {
			focusNext(deskCloseId(deskId))
			disarm(deskId)
		},
		[focusNext, disarm],
	)
	const isArmedIdle = armedId !== null && !closingIds.has(armedId)
	useEscapeToDisarm(isArmedIdle ? armedId : null, keep)

	// A refused close puts its row back at rest, Close taking focus in the same render. A done
	// one stays "closing" - holding the order - until focus has landed on the neighbour, in the
	// render that drops its row.
	const confirm = async (
		desk: HubDesk,
		projects: readonly HubProject[],
	): Promise<void> => {
		const after = focusAfterClose(projects, desk.id)
		begin(desk.id)
		const outcome = await closeOutcome(desk)
		report(outcome)
		await refresh()
		disarm(desk.id)
		if (outcome.result === 'failed') {
			settle(desk.id)
			focusNext(deskCloseId(desk.id))
		} else focusNext(after, () => settle(desk.id))
	}

	return {
		isArmed: armedId !== null,
		isHolding: armedId !== null || closingIds.size > 0,
		stateOf: deskId => {
			if (closingIds.has(deskId)) return 'closing'
			return armedId === deskId ? 'armed' : 'rest'
		},
		actionsFor: (desk, projects) => ({
			arm: () => {
				focusNext(deskKeepId(desk.id))
				arm(desk.id)
			},
			keep: () => keep(desk.id),
			release: () => disarm(desk.id),
			confirm: () => void confirm(desk, projects),
		}),
	}
}

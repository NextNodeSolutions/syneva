import { useCallback, useState } from 'react'

import { closeHubDesk, hubRefusal } from '@entities/hub/api'

import { focusAfterClose } from './focus-after-close'
import { deskCloseId, deskKeepId } from './focus-targets'
import { useArmedDesk } from './use-armed-desk'
import { useEscapeToDisarm } from './use-escape-to-disarm'
import { useFocusNext } from './use-focus-next'

import type { HubDesk } from '@entities/hub/model'
import type { ListedGroups } from './focus-after-close'
import type { CloseOutcome } from './use-close-notice'

export type CloseState = 'rest' | 'armed' | 'closing'

export type CloseActions = {
	arm: () => void
	keep: () => void
	release: () => void
	confirm: () => void
}

// One desk's close as its row or its card reads it: where it stands and what it can do.
export type RowClose = { state: CloseState; actions: CloseActions }

export type DeskClose = {
	isArmed: boolean
	isHolding: boolean
	stateOf: (deskId: string) => CloseState
	// `groups`: the rows as displayed, for where focus goes once this row leaves.
	actionsFor: (desk: HubDesk, groups: ListedGroups) => CloseActions
}

type DeskCloseDeps = {
	desks: readonly HubDesk[]
	report: (outcome: CloseOutcome) => void
	refresh: () => Promise<void>
}

const NONE: ReadonlySet<string> = new Set()

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

	const confirm = async (
		desk: HubDesk,
		groups: ListedGroups,
	): Promise<void> => {
		const after = focusAfterClose(groups, desk.id)
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
		actionsFor: (desk, groups) => ({
			arm: () => {
				focusNext(deskKeepId(desk.id))
				arm(desk.id)
			},
			keep: () => keep(desk.id),
			release: () => disarm(desk.id),
			confirm: () => void confirm(desk, groups),
		}),
	}
}

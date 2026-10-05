import { useRef, useState } from 'react'

import { holdListeners } from '@shared/lib/hold-listeners'

import { useHeldCountdown } from './use-held-countdown'

import type { HubRefusal } from '@entities/hub/api'
import type { HoldListeners } from '@shared/lib/hold-listeners'

// Why a close did not happen: the hub refused it (with its reason), this browser is signed
// out, or no answer came back.
export type CloseFailure = Exclude<HubRefusal, { kind: 'aborted' }>

// How a close ended, in the hub's terms: closed (its agent was told only if one was listening:
// the hub hands the event to a parked await and drops the desk's queue moments later), already
// gone, or not done - and why.
export type CloseOutcome =
	| { result: 'closed'; session: string; wasAgentListening: boolean }
	| { result: 'already-closed'; session: string }
	| { result: 'failed'; session: string; cause: CloseFailure }

// The outcome on screen; `id` tells a newer notice from the one it replaces.
export type ShownNotice = CloseOutcome & { id: number }

export type CloseNoticeState = {
	notice: ShownNotice | null
	show: (outcome: CloseOutcome) => void
	dismiss: () => void
	// What the toast's container listens to: while the pointer is over it or focus is in it,
	// it stays.
	hold: HoldListeners
}

// How long a notice stays once nobody holds it.
const SHOWN_MS = 6000

// The toast after a close: one notice at a time (a newer one replaces it), gone after
// SHOWN_MS unless the pointer or focus holds it.
export function useCloseNotice(): CloseNoticeState {
	const [notice, setNotice] = useState<ShownNotice | null>(null)
	const lastId = useRef(0)
	const countdown = useHeldCountdown(() => setNotice(null))
	return {
		notice,
		show: outcome => {
			lastId.current += 1
			setNotice({ ...outcome, id: lastId.current })
			countdown.start(SHOWN_MS)
		},
		dismiss: () => {
			countdown.stop()
			setNotice(null)
		},
		hold: holdListeners(countdown),
	}
}

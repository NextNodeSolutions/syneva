import { useRef, useState } from 'react'

import { holdListeners } from '@shared/lib/hold-listeners'
import { isMotionReduced } from '@shared/lib/motion'

import { useHeldCountdown } from './use-held-countdown'

import type { HubRefusal } from '@entities/hub/api'
import type { HoldListeners } from '@shared/lib/hold-listeners'

export type CloseFailure = Exclude<HubRefusal, { kind: 'aborted' }>

export type CloseOutcome =
	| { result: 'closed'; session: string; wasAgentListening: boolean }
	| { result: 'already-closed'; session: string }
	| { result: 'failed'; session: string; cause: CloseFailure }

export type ShownNotice = CloseOutcome & { id: number }

export type CloseNoticeState = {
	notice: ShownNotice | null
	// The notice is on its way out (dismissed or timed out): it fades before it unmounts.
	isLeaving: boolean
	show: (outcome: CloseOutcome) => void
	dismiss: () => void
	hold: HoldListeners
}

const SHOWN_MS = 6000
const LEAVE_MS = 150

export function useCloseNotice(): CloseNoticeState {
	const [notice, setNotice] = useState<ShownNotice | null>(null)
	const [isLeaving, setLeaving] = useState(false)
	const lastId = useRef(0)
	const leaving = useRef(0)
	const leave = (): void => {
		window.clearTimeout(leaving.current)
		if (isMotionReduced()) {
			setNotice(null)
			return
		}
		setLeaving(true)
		leaving.current = window.setTimeout(() => {
			setNotice(null)
			setLeaving(false)
		}, LEAVE_MS)
	}
	const countdown = useHeldCountdown(leave)
	return {
		notice,
		isLeaving,
		show: outcome => {
			window.clearTimeout(leaving.current)
			setLeaving(false)
			lastId.current += 1
			setNotice({ ...outcome, id: lastId.current })
			countdown.start(SHOWN_MS)
		},
		dismiss: () => {
			countdown.stop()
			leave()
		},
		hold: holdListeners(countdown),
	}
}

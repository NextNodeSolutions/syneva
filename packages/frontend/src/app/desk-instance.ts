import { S } from './store'

import type {
	DeskStateSnapshot,
	DeskStatus,
	ReviewState,
} from '@entities/review/model'

// The desk instance this tab loaded, from its first /state read: every later read (a /state, a
// pulse from the hub's stream) that speaks for another one means the hub restarted or rebuilt the
// desk underneath the tab.
let serverInstanceId: string | undefined

// A notification is safer than automatic navigation: stage/unstage/Send can still be in flight after their dialogs close.
export function isCurrentDesk(instance: string | undefined): boolean {
	if (!serverInstanceId || instance === serverInstanceId) return true
	S.isRefreshRequired = true
	return false
}

// They must never enter S.state: persist() posts S.state back to /save, and the persisted review must not carry desk liveness.
export function adoptLiveness(status: Partial<DeskStatus>): void {
	S.agentActivity = status.agentActivity?.body ?? null
	S.agentListening = status.agentListening ?? false
	S.queuedQuestions = status.queuedQuestions ?? 0
	S.queuedReviews = status.queuedReviews ?? 0
}

export function adoptDeskStatus(payload: DeskStateSnapshot): ReviewState {
	const {
		agentActivity,
		agentListening,
		queuedQuestions,
		queuedReviews,
		serverInstanceId: instance,
		...review
	} = payload
	serverInstanceId ??= instance
	adoptLiveness({
		agentActivity,
		agentListening,
		queuedQuestions,
		queuedReviews,
	})
	return review
}

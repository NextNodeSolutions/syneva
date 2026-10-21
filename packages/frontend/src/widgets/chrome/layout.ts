import { isHeldOff } from '@entities/hub/held'

import type { ReviewState } from '@entities/review/model'
import type { ChromeStoreView } from './context'

// What the desk's frame lays out: the tree column, a cover standing in for the review, a notice
// row over it.

export function isTreeless({ state }: { state: ReviewState | null }): boolean {
	return (state?.files.length ?? 0) <= 1 || state?.mode === 'file'
}

type CoverFacts = Pick<
	ChromeStoreView,
	'isRefreshRequired' | 'deskClosed' | 'hubStatus' | 'relayNotice'
>

// What stands in for the review: the desk left the hub, or this browser can no longer reach it
// (signed out). A desk the hub restarted under the tab asks for a refresh instead, which wins.
export type DeskCover = 'closed' | 'signed-out' | null

// The row over the review: refresh this tab, the hub's stream is held off (not answering, or
// asking the tab to wait) and the review on screen may be behind, or the web cannot reach the
// desk's hub.
export type DeskNotice = 'refresh' | 'held' | 'relay' | null

export function deskCover(facts: CoverFacts): DeskCover {
	if (facts.isRefreshRequired) return null
	if (facts.deskClosed) return 'closed'
	if (facts.hubStatus !== 'signed-out') return null
	return 'signed-out'
}

export function deskNotice(facts: CoverFacts): DeskNotice {
	if (facts.isRefreshRequired) return 'refresh'
	if (deskCover(facts)) return null
	if (isHeldOff(facts.hubStatus)) return 'held'
	if (facts.relayNotice) return 'relay'
	return null
}

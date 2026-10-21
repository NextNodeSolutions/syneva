import { isHeldOff } from '@entities/hub/held'

import type { HeldStatus } from '@entities/hub/link'
import type { HubDesk } from '@entities/hub/model'
import type { HubView } from '@entities/hub/use-hub'

export type HubPhase =
	| { kind: 'loading' }
	| { kind: 'signed-out' }
	// Nothing listed yet, and the stream waits before it tries again: `retryAt` says until when
	// (null while an attempt is under way).
	| { kind: HeldStatus; retryAt: number | null }
	| { kind: 'listed'; desks: HubDesk[]; isStale: boolean }

// A listing waits for the journal's first read (`isJournalRead`, settled answered or not): the
// pages order their desks by how long each turn has lasted, which the journal says, so a page
// mounts once, in its final order, and nothing reshuffles under its entrance.
export function hubPhase(
	{ status, desks, link }: Pick<HubView, 'status' | 'desks' | 'link'>,
	isJournalRead: boolean,
): HubPhase {
	if (status === 'signed-out') return { kind: 'signed-out' }
	const isHeld = isHeldOff(status)
	if (desks && isJournalRead)
		return { kind: 'listed', desks, isStale: isHeld }
	if (isHeld) return { kind: status, retryAt: link.retryAt }
	return { kind: 'loading' }
}

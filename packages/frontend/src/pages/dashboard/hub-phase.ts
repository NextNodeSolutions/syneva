import type { HubDesk } from '@entities/hub/model'
import type { HubView } from '@entities/hub/use-hub'

// What the page can say about the hub, from how it last answered: nothing yet; this browser
// is signed out (the listing is hidden, whatever was listed before); the hub never answered;
// or a listing (stale while the hub is not answering, every pulse then off).
export type HubPhase =
	| { kind: 'loading' }
	| { kind: 'signed-out' }
	| { kind: 'unreachable' }
	| { kind: 'listed'; desks: HubDesk[]; isStale: boolean }

// A listing waits for the journal's first read (`isJournalRead`, settled answered or not): the
// pages order their desks by how long each turn has lasted, which the journal says, so a page
// mounts once, in its final order, and nothing reshuffles under its entrance.
export function hubPhase(
	{ status, desks }: Pick<HubView, 'status' | 'desks'>,
	isJournalRead: boolean,
): HubPhase {
	if (status === 'signed-out') return { kind: 'signed-out' }
	if (!desks || !isJournalRead)
		return { kind: status === 'unreachable' ? 'unreachable' : 'loading' }
	return { kind: 'listed', desks, isStale: status === 'unreachable' }
}

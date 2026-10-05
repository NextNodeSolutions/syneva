import { groupByProject } from '@entities/hub/model'

import { hubPhase } from './hub-phase'
import { useCloseNotice } from './use-close-notice'
import { useDeskClose } from './use-desk-close'
import { useDocumentTitle } from './use-document-title'
import { useHeldOrder } from './use-held-order'
import { useHub } from './use-hub'
import { useListHold } from './use-list-hold'
import { useNewReviewDialog } from './use-new-review-dialog'
import { useNewReviewShortcut } from './use-new-review-shortcut'

import type { HubDesk, HubProject } from '@entities/hub/model'
import type { StageCounts } from '@entities/hub/stage'
import type { HubPhase } from './hub-phase'
import type { CloseNoticeState } from './use-close-notice'
import type { DeskClose } from './use-desk-close'
import type { HubView } from './use-hub'
import type { ListHold } from './use-list-hold'
import type { NewReviewDialog } from './use-new-review-dialog'

type Listed = Extract<HubPhase, { kind: 'listed' }>

const NO_DESKS: readonly HubDesk[] = []

// The listing on screen as the footer counts it (desks, projects) and when it landed.
export type FooterListing = {
	desks: number
	projects: number
	syncedAt: number | null
}

export type DashboardState = {
	hub: HubView
	phase: HubPhase
	// The listing when there is one to show (not while loading, signed out or never listed).
	listed: Listed | null
	// Its projects in display order.
	projects: HubProject[]
	// What the header offers: Sign out (a keyed hub, once its health says so, to a browser still
	// signed in) and New review (null when the page offers none).
	header: { canSignOut: boolean; onNewReview: (() => void) | null }
	toast: CloseNoticeState
	hold: ListHold
	close: DeskClose
	// The register's counts, shown over a listing with desks in it.
	registerCounts: StageCounts | null
	// What the footer counts: the listing on screen, and when it landed.
	footerListing: FooterListing | null
	newReview: NewReviewDialog
}

function headerOffer(
	hub: HubView,
	phase: HubPhase,
	newReview: NewReviewDialog,
): DashboardState['header'] {
	return {
		canSignOut:
			hub.health?.keyRequired === true && phase.kind !== 'signed-out',
		onNewReview: newReview.offer,
	}
}

// The dashboard's state, wired: the hub's poll and what it says, the listing's held order
// (still while the pointer or keyboard focus is in it, a close is armed or under way, or New
// review is open), the closes and their toast, New review and its N shortcut (silent while a
// close is armed: Keep holds focus and the reviewer is mid-decision), the tab's title.
export function useDashboard(): DashboardState {
	const hub = useHub()
	const toast = useCloseNotice()
	const hold = useListHold()
	const phase = hubPhase(hub)
	const listed = phase.kind === 'listed' ? phase : null
	const close = useDeskClose({
		desks: listed?.desks ?? NO_DESKS,
		report: toast.show,
		refresh: hub.refresh,
	})
	const newReview = useNewReviewDialog(phase)
	useNewReviewShortcut({ open: newReview.offer, isQuiet: close.isArmed })
	const projects = useHeldOrder(groupByProject(listed?.desks ?? NO_DESKS), {
		isHeld: hold.isHeld || close.isHolding || newReview.isOpen,
	})
	useDocumentTitle(hub.status, listed?.counts.yours ?? 0)
	return {
		hub,
		phase,
		listed,
		projects,
		header: headerOffer(hub, phase, newReview),
		toast,
		hold,
		close,
		registerCounts: listed?.desks.length ? listed.counts : null,
		footerListing: listed && {
			desks: listed.desks.length,
			projects: projects.length,
			syncedAt: hub.syncedAt,
		},
		newReview,
	}
}

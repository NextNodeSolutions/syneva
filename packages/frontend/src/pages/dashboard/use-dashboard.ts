import { useMemo } from 'react'

import { turnStarts } from '@entities/hub/journal-stats'
import { groupByProject } from '@entities/hub/model'
import { turnSince } from '@entities/hub/turn'
import { useHub } from '@entities/hub/use-hub'
import { useJournal } from '@entities/hub/use-journal'
import { navCountsOf } from '@widgets/hub-shell/nav'

import { hubPhase } from './hub-phase'
import { useCloseNotice } from './use-close-notice'
import { useDeskClose } from './use-desk-close'
import { useDocumentTitle } from './use-document-title'
import { useListHold } from './use-list-hold'
import { useNewReviewDialog } from './use-new-review-dialog'
import { useNewReviewShortcut } from './use-new-review-shortcut'

import type { Journal } from '@entities/hub/journal'
import type { HubDesk, HubProject } from '@entities/hub/model'
import type { HubView } from '@entities/hub/use-hub'
import type { NavCounts } from '@widgets/hub-shell/nav'
import type { HubPhase } from './hub-phase'
import type { WaitingSince } from './overview/groups'
import type { CloseNoticeState } from './use-close-notice'
import type { DeskClose } from './use-desk-close'
import type { ListHold } from './use-list-hold'
import type { NewReviewDialog } from './use-new-review-dialog'

export type Listed = Extract<HubPhase, { kind: 'listed' }>

const NO_DESKS: readonly HubDesk[] = []

// Everything the dashboard's pages read: the hub's poll and what it says, the journal, the
// repositories, the closes and their toast, New review, and whether the lists must hold their
// order still (the reviewer is in one, a close is armed or under way, New review is open).
export type DashboardState = {
	hub: HubView
	phase: HubPhase
	// The listing when there is one to show (not while loading, signed out or never listed).
	listed: Listed | null
	journal: Journal
	projects: HubProject[]
	toast: CloseNoticeState
	hold: ListHold
	isListHeld: boolean
	close: DeskClose
	newReview: NewReviewDialog
	// When a desk's current turn began (entities/hub/turn.ts turnSince): one meaning of time
	// on every display.
	since: WaitingSince
	// The live desks' pages, by id: what a journal line links to.
	livePaths: ReadonlyMap<string, string>
	navCounts: NavCounts | null
}

export function useDashboard(): DashboardState {
	const hub = useHub()
	const journal = useJournal()
	const toast = useCloseNotice()
	const hold = useListHold()
	const phase = hubPhase(hub)
	const listed = phase.kind === 'listed' ? phase : null
	const desks = listed?.desks ?? NO_DESKS
	const close = useDeskClose({
		desks,
		report: toast.show,
		refresh: hub.refresh,
	})
	const newReview = useNewReviewDialog(phase)
	useNewReviewShortcut({ open: newReview.offer, isQuiet: close.isArmed })
	const projects = groupByProject(desks)
	const navCounts = navCountsOf(listed?.desks ?? null)
	useDocumentTitle(hub.status, navCounts?.yours ?? 0)
	// Read from the events alone, which keep their identity across a poll that brought none.
	const starts = useMemo(() => turnStarts(journal.events), [journal.events])
	return {
		hub,
		phase,
		listed,
		journal,
		projects,
		toast,
		hold,
		isListHeld: hold.isHeld || close.isHolding || newReview.isOpen,
		close,
		newReview,
		since: desk => turnSince(desk, starts.get(desk.id)),
		livePaths: new Map(desks.map(desk => [desk.id, desk.path])),
		navCounts,
	}
}

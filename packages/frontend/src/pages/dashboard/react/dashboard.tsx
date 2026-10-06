import { usePlace } from '@shared/lib/use-place'
import { HubShell } from '@widgets/hub-shell/react/hub-shell'

import { NEW_REVIEW_ID } from '../focus-targets'
import { knownRoots } from '../known-roots'
import { pageOf } from '../route'
import { useDashboard } from '../use-dashboard'

import { CloseNotice } from './close-notice'
import { DashboardPage } from './dashboard-page'
import { NewReviewDialog } from './new-review-dialog'
import { SkipLink } from './skip-link'
import { UnreachableStrip } from './unreachable-strip'

import type { ReactElement } from 'react'

// The hub dashboard: the skip link, the shell (the sidebar and the page beside it), the
// unreachable strip over a kept listing, the page the URL names and the close toast fixed
// against it (under the page's own panels), then the New review dialog over everything. A signed-out browser is offered no New review: only the way
// back in.
export function Dashboard(): ReactElement {
	const dashboard = useDashboard()
	const place = usePlace()
	const { offer } = dashboard.newReview
	return (
		<>
			<SkipLink />
			<HubShell
				model={{
					pathname: place.pathname,
					counts: dashboard.navCounts,
					status: dashboard.hub.status,
					version: dashboard.hub.health?.version ?? null,
				}}
				newReview={offer && { id: NEW_REVIEW_ID, open: offer }}
			>
				<UnreachableStrip
					isShown={dashboard.listed?.isStale === true}
				/>
				<DashboardPage
					page={pageOf(place.pathname)}
					dashboard={dashboard}
				/>
				<CloseNotice toast={dashboard.toast} />
			</HubShell>
			{dashboard.newReview.isOpen && (
				<NewReviewDialog
					roots={knownRoots(
						dashboard.projects,
						dashboard.journal.events,
					)}
					seed={dashboard.newReview.seed}
					onClose={dashboard.newReview.close}
				/>
			)}
		</>
	)
}

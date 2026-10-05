import * as stylex from '@stylexjs/stylex'

import { useDashboard } from '../use-dashboard'

import { CloseNotice } from './close-notice'
import { dashboard } from './dashboard.styles'
import { DeskListing } from './desk-listing'
import { HubFooter } from './hub-footer'
import { HubHead } from './hub-head'
import { HubHeader } from './hub-header'
import { HubMain } from './hub-main'
import { HubRegister } from './hub-register'
import { NewReviewDialog } from './new-review-dialog'
import { SkipLink } from './skip-link'
import { UnreachableStrip } from './unreachable-strip'

import type { ReactElement } from 'react'

// The hub dashboard, in document order: the skip link, the header, the unreachable strip
// (over a kept listing), the head with its statement and register, the listing (or the empty
// band, which runs down to the footer), the footer bar, then the toast and the New review
// dialog over the page. A signed-out browser is offered neither New review nor Sign out (its
// sign-in already ended): only the way back in.
export function Dashboard(): ReactElement {
	const { hub, phase, listed, projects, ...page } = useDashboard()
	return (
		<div {...stylex.props(dashboard.frame)}>
			<SkipLink />
			<HubHeader {...page.header} />
			<UnreachableStrip isShown={listed?.isStale === true} />
			<HubHead phase={phase}>
				{page.registerCounts && (
					<HubRegister counts={page.registerCounts} />
				)}
			</HubHead>
			<HubMain
				bind={page.hold.bind}
				listeners={page.hold.listeners}
				isEmpty={listed?.desks.length === 0}
			>
				{listed && (
					<DeskListing
						projects={projects}
						now={hub.now}
						freshness={{
							isLive: !listed.isStale,
							arrivedIds: hub.arrivedIds,
						}}
						close={page.close}
						onNewReview={page.newReview.open}
					/>
				)}
			</HubMain>
			<HubFooter
				status={hub.status}
				listing={page.footerListing}
				health={hub.health}
				now={hub.now}
			/>
			<CloseNotice toast={page.toast} />
			{page.newReview.isOpen && (
				<NewReviewDialog
					roots={projects.map(project => project.root)}
					onClose={page.newReview.close}
				/>
			)}
		</div>
	)
}

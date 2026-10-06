import * as stylex from '@stylexjs/stylex'

import { currentNav, HUB_NAV, WORK_NAV } from '../nav'

import { HubIdentity } from './hub-identity'
import { sidebar } from './hub-sidebar.styles'
import { NewReviewEntry } from './new-review-entry'
import { SidebarBrand } from './sidebar-brand'
import { SidebarFoot } from './sidebar-foot'
import { SidebarNav } from './sidebar-nav'

import type { HubStatus } from '@entities/hub/use-hub'
import type { ReactElement, ReactNode } from 'react'
import type { NavCounts, NavId } from '../nav'
import type { SidebarFold } from '../use-sidebar-fold'

// The hub's own pages under their group label (which folds away with the labels).
function HubNav({
	current,
	isFolded,
}: {
	current: NavId | null
	isFolded: boolean
}): ReactElement {
	return (
		<nav aria-labelledby="hub-nav-label">
			<p
				id="hub-nav-label"
				data-enter="slide"
				{...stylex.props(
					sidebar.group,
					sidebar.label,
					isFolded && sidebar.labelFolded,
				)}
			>
				Hub
			</p>
			<SidebarNav
				entries={HUB_NAV}
				current={current}
				counts={null}
				isFolded={isFolded}
			/>
		</nav>
	)
}

// What the sidebar shows of the hub: where the page is, the counts beside the entries (null
// before the first listing), and how the hub answers.
export type SidebarModel = {
	pathname: string
	counts: NavCounts | null
	status: HubStatus
	version: string | null
}

// The New review action, when the page offers one: its element id (focus returns to it when
// the dialog closes) and what opens it. The desk's rail offers none.
export type NewReviewOffer = { id: string; open: () => void }

// The hub's sidebar: the wordmark, the hub it belongs to, New review, the work (overview,
// reviews, projects, plans), the hub's own pages, then its state and the fold. Folded, the
// same entries stand on the rail as icons, in the same places.
export function HubSidebar({
	model,
	fold,
	newReview,
	children,
}: {
	model: SidebarModel
	fold: SidebarFold
	newReview: NewReviewOffer | null
	// What a page adds under the hub's own entries (the desk's rail: the other desks waiting on
	// you), below the icons the rail shows, so it never moves them.
	children?: ReactNode
}): ReactElement {
	const current = currentNav(model.pathname)
	const { isFolded } = fold
	return (
		<aside {...stylex.props(sidebar.root)} aria-label="Hub">
			<div {...stylex.props(sidebar.top)}>
				<SidebarBrand isFolded={isFolded} />
			</div>
			<HubIdentity status={model.status} isFolded={isFolded} />
			{newReview && (
				<NewReviewEntry
					id={newReview.id}
					isFolded={isFolded}
					onOpen={newReview.open}
				/>
			)}
			<nav aria-label="Work">
				<SidebarNav
					entries={WORK_NAV}
					current={current}
					counts={model.counts}
					isFolded={isFolded}
				/>
			</nav>
			<HubNav current={current} isFolded={isFolded} />
			{children}
			<SidebarFoot
				status={model.status}
				version={model.version}
				fold={fold}
			/>
		</aside>
	)
}

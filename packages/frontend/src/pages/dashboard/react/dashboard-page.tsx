import { lazy, Suspense } from 'react'

import { FallbackBoundary } from '@shared/ui/fallback-boundary'

import { HubPage } from '../hub/hub-page'
import { OverviewPage } from '../overview/react/overview-page'
import { PlansPage } from '../plans/plans-page'
import { ProjectPage } from '../projects/project-page'
import { ProjectsPage } from '../projects/projects-page'
import { ReviewsPage } from '../reviews/reviews-page'
import { SettingsPage } from '../settings/settings-page'

import { MissingPage } from './missing-page'
import { PageHead } from './page-head'

import type { HubDesk } from '@entities/hub/model'
import type { ReactElement } from 'react'
import type { DashboardPage as Page } from '../route'
import type { DashboardState } from '../use-dashboard'

// A plan's page brings the markdown renderer's front half and the reading layout: it loads
// when a plan is opened, so the dashboard's cold open stays the listings' alone.
const PlanPage = lazy(async () => {
	const module = await import('../plans/plan-page')
	return { default: module.PlanPage }
})

// Before the hub's first listing a plan's page knows of no live desk but the library's own.
const NO_DESKS: readonly HubDesk[] = []

// A page that fails to render, or whose chunk does not load (the hub was upgraded under an
// open tab), says so in its place: the sidebar and every other page stay.
function PageUnavailable(): ReactElement {
	return (
		<PageHead
			title="Could not load"
			lede="This page could not load from the hub. Reload to try again."
		/>
	)
}

function pageKey(page: Page): string {
	return 'id' in page ? `${page.kind}/${page.id}` : page.kind
}

function PageContent({
	page,
	dashboard,
}: {
	page: Page
	dashboard: DashboardState
}): ReactElement {
	if (page.kind === 'overview') return <OverviewPage dashboard={dashboard} />
	if (page.kind === 'reviews') return <ReviewsPage dashboard={dashboard} />
	if (page.kind === 'projects') return <ProjectsPage dashboard={dashboard} />
	if (page.kind === 'project')
		return <ProjectPage id={page.id} dashboard={dashboard} />
	if (page.kind === 'plans') return <PlansPage dashboard={dashboard} />
	if (page.kind === 'plan')
		return (
			<Suspense fallback={null}>
				<PlanPage
					id={page.id}
					desks={dashboard.listed?.desks ?? NO_DESKS}
				/>
			</Suspense>
		)
	if (page.kind === 'settings') return <SettingsPage />
	if (page.kind === 'hub') return <HubPage dashboard={dashboard} />
	return <MissingPage />
}

// The page the URL names, keyed by it: a move to another page mounts it afresh (its own
// entrance plays, its scroll starts at the top) and clears a failure the last one met.
export function DashboardPage({
	page,
	dashboard,
}: {
	page: Page
	dashboard: DashboardState
}): ReactElement {
	return (
		<FallbackBoundary key={pageKey(page)} fallback={<PageUnavailable />}>
			<PageContent page={page} dashboard={dashboard} />
		</FallbackBoundary>
	)
}

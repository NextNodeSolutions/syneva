import { lazy, Suspense } from 'react'

import { HubPage } from '../hub/hub-page'
import { OverviewPage } from '../overview/react/overview-page'
import { PlansPage } from '../plans/plans-page'
import { ProjectPage } from '../projects/project-page'
import { ProjectsPage } from '../projects/projects-page'
import { ReviewsPage } from '../reviews/reviews-page'
import { SettingsPage } from '../settings/settings-page'

import { MissingPage } from './missing-page'
import { PageHead } from './page-head'

import type { ReactElement } from 'react'
import type { DashboardPage as Page } from '../route'
import type { DashboardState } from '../use-dashboard'

// A plan's page brings the markdown renderer's front half and the reading layout: it loads
// when a plan is opened, so the dashboard's cold open stays the listings' alone.
// A chunk that fails to load (the hub was upgraded under an open tab) says so instead of
// throwing: no error boundary sits above, so a rejection would unmount the whole dashboard.
const PlanPage = lazy(async () => {
	try {
		const module = await import('../plans/plan-page')
		return { default: module.PlanPage }
	} catch {
		return { default: PlanPageUnavailable }
	}
})

function PlanPageUnavailable(): ReactElement {
	return (
		<PageHead
			title="Plan"
			lede="This page could not load from the hub. Reload to try again."
		/>
	)
}

// The page the URL names, keyed by it: a move to another page mounts it afresh, so its own
// entrance plays and its scroll starts at the top.
export function DashboardPage({
	page,
	dashboard,
}: {
	page: Page
	dashboard: DashboardState
}): ReactElement {
	if (page.kind === 'overview')
		return <OverviewPage key="overview" dashboard={dashboard} />
	if (page.kind === 'reviews')
		return <ReviewsPage key="reviews" dashboard={dashboard} />
	if (page.kind === 'projects')
		return <ProjectsPage key="projects" dashboard={dashboard} />
	if (page.kind === 'project')
		return <ProjectPage key={page.id} id={page.id} dashboard={dashboard} />
	if (page.kind === 'plans')
		return <PlansPage key="plans" dashboard={dashboard} />
	if (page.kind === 'plan')
		return (
			<Suspense key={page.id} fallback={null}>
				<PlanPage id={page.id} />
			</Suspense>
		)
	if (page.kind === 'settings') return <SettingsPage key="settings" />
	if (page.kind === 'hub') return <HubPage key="hub" dashboard={dashboard} />
	return <MissingPage key="missing" />
}

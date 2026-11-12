import { DashboardPage } from '@pages/dashboard/ui/DashboardPage'
import { NotFoundPage } from '@pages/not-found/ui/NotFoundPage'
import { ProjectPage } from '@pages/project/ui/ProjectPage'
import { ReviewPage } from '@pages/review/ui/ReviewPage'
import { SettingsPage } from '@pages/settings/ui/SettingsPage'
import { usePathname } from '@shared/router/use-pathname'
import { PAGE_ROUTES } from '@shared/routes/page-routes'
import { matchPath } from '@syneva/contracts/paths'
import { projectRefSchema, reviewRefSchema } from '@syneva/contracts/projects'

import type { ReactElement } from 'react'

export function PageOutlet(): ReactElement {
	const pathname = usePathname()
	if (pathname === PAGE_ROUTES.dashboard) return <DashboardPage />
	if (pathname === PAGE_ROUTES.settings) return <SettingsPage />
	const project = projectRefSchema.safeParse(
		matchPath(PAGE_ROUTES.project, pathname),
	)
	if (project.success) return <ProjectPage project={project.data} />
	const review = reviewRefSchema.safeParse(
		matchPath(PAGE_ROUTES.review, pathname),
	)
	if (!review.success) return <NotFoundPage />
	return <ReviewPage review={review.data} />
}

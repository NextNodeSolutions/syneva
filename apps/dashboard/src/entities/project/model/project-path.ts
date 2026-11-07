import { PAGE_ROUTES } from '@shared/routes/page-routes'
import { fillPath } from '@syneva/contracts/paths'

import type { ProjectRef } from '@syneva/contracts/projects'

export function projectPath(project: ProjectRef): string {
	return fillPath(PAGE_ROUTES.project, project)
}

export function isProjectPath(project: ProjectRef, pathname: string): boolean {
	const path = projectPath(project)
	return pathname === path || pathname.startsWith(`${path}/`)
}

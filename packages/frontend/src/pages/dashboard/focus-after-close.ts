import { deskLinkId, NEW_REVIEW_ID } from './focus-targets'

import type { HubProject } from '@entities/hub/model'

// Where focus goes when a desk's row leaves: the next row of its project, else the one
// before it, else the first row of the next project, else New review.
export function focusAfterClose(
	projects: readonly HubProject[],
	deskId: string,
): string {
	const at = projects.findIndex(project =>
		project.desks.some(desk => desk.id === deskId),
	)
	const project = projects[at]
	if (!project) return NEW_REVIEW_ID
	const index = project.desks.findIndex(desk => desk.id === deskId)
	const neighbour =
		project.desks[index + 1] ??
		project.desks[index - 1] ??
		projects[at + 1]?.desks[0]
	return neighbour ? deskLinkId(neighbour.id) : NEW_REVIEW_ID
}

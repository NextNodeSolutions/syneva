import { DeskRow } from './desk-row'
import { EmptyHub } from './empty-hub'
import { ProjectSection } from './project-section'

import type { HubProject } from '@entities/hub/model'
import type { ReactElement } from 'react'
import type { DeskClose } from '../use-desk-close'

type DeskListingProps = {
	// In the order they are displayed (held while the reviewer is in the listing).
	projects: readonly HubProject[]
	now: number
	// The hub answered this listing (squares may pulse) / the desks new in it.
	freshness: { isLive: boolean; arrivedIds: ReadonlySet<string> }
	close: DeskClose
	onNewReview: () => void
}

// Every desk the hub hosts, by repository; the empty band when it hosts none.
export function DeskListing({
	projects,
	now,
	freshness,
	close,
	onNewReview,
}: DeskListingProps): ReactElement {
	if (!projects.length) return <EmptyHub onNewReview={onNewReview} />
	return (
		<>
			{projects.map(project => (
				<ProjectSection key={project.root} project={project}>
					{project.desks.map(desk => (
						<DeskRow
							key={desk.id}
							desk={desk}
							now={now}
							look={{
								isLive: freshness.isLive,
								hasArrived: freshness.arrivedIds.has(desk.id),
							}}
							close={{
								state: close.stateOf(desk.id),
								actions: close.actionsFor(desk, projects),
							}}
						/>
					))}
				</ProjectSection>
			))}
		</>
	)
}

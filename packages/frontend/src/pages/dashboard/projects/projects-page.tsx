import { useRef } from 'react'

import { useEntrance } from '@shared/lib/use-entrance'
import { AppLink } from '@shared/ui/app-link'
import { ArrowRight } from '@shared/ui/arrow-right'
import * as stylex from '@stylexjs/stylex'
import { projectPagePath } from '@syneva/contracts/routes'
import { focus } from '@syneva/design-system/controls.styles'

import { displayRoot, plural, relativeTime } from '../format'
import { listPage } from '../react/list-page.styles'
import { PageHead } from '../react/page-head'
import { PhasePage } from '../react/phase-page'

import { projectIndex } from './project-index'
import { projectsList } from './projects.styles'

import type { ReactElement } from 'react'
import type { DashboardState } from '../use-dashboard'
import type { ProjectEntry } from './project-index'

// The row's figures, each in its column: live desks, what waits on you, rounds this week and
// the last move; on a narrow page they fold into one line under the name.
function ProjectFigures({
	entry,
	last,
}: {
	entry: ProjectEntry
	last: string
}): ReactElement {
	const quiet = projectsList.figureMuted
	return (
		<>
			<span
				{...stylex.props(
					projectsList.figure,
					!entry.desks.length && quiet,
				)}
			>
				{entry.desks.length}
			</span>
			<span
				{...stylex.props(
					projectsList.figure,
					entry.yours > 0 ? projectsList.yours : quiet,
				)}
			>
				{entry.yours}
			</span>
			<span {...stylex.props(projectsList.figure)}>
				{entry.roundsThisWeek}
			</span>
			<span {...stylex.props(projectsList.figure, quiet)}>{last}</span>
			<ArrowRight css={projectsList.arrow} />
			<span {...stylex.props(projectsList.summary)}>
				{`${plural(entry.desks.length, 'desk')} · ${entry.yours} waiting on you · ${plural(entry.roundsThisWeek, 'round')} this week · ${last}`}
			</span>
		</>
	)
}

function ProjectRow({
	entry,
	now,
}: {
	entry: ProjectEntry
	now: number
}): ReactElement {
	const last = entry.lastAt
		? relativeTime(entry.lastAt, now)
		: 'no activity yet'
	return (
		<li data-enter="rise">
			<AppLink
				href={projectPagePath(entry.id)}
				css={[focus.inset, projectsList.row]}
				aria-label={`${entry.name}: ${plural(entry.desks.length, 'live desk')}, ${entry.yours} waiting on you`}
			>
				<span>
					<span {...stylex.props(projectsList.name)}>
						{entry.name}
					</span>
					<span
						{...stylex.props(projectsList.path)}
						title={entry.root}
					>
						{displayRoot(entry.root)}
					</span>
				</span>
				<ProjectFigures entry={entry} last={last} />
			</AppLink>
		</li>
	)
}

// Every repository the hub has seen: the ones with live desks first, then the ones the journal
// remembers. Each opens its own page.
export function ProjectsPage({
	dashboard,
}: {
	dashboard: DashboardState
}): ReactElement {
	const root = useRef<HTMLDivElement>(null)
	useEntrance(root, 'projects')
	if (!dashboard.listed)
		return (
			<PhasePage
				phase={dashboard.phase}
				onNewReview={dashboard.newReview.offer}
			/>
		)
	const entries = projectIndex(
		dashboard.projects,
		dashboard.journal.events,
		dashboard.hub.now,
	)
	return (
		<div ref={root} {...stylex.props(listPage.page)}>
			<PageHead
				title="Projects"
				lede={`${plural(entries.length, 'repository', 'repositories')} this hub has reviewed, with their desks and their rounds.`}
			/>
			<div {...stylex.props(listPage.body, projectsList.root)}>
				<p {...stylex.props(projectsList.head)} aria-hidden="true">
					<span>Repository</span>
					<span>Live desks</span>
					<span>Wait on you</span>
					<span>Rounds · 7 days</span>
					<span>Last move</span>
					<span />
				</p>
				<ul>
					{entries.map(entry => (
						<ProjectRow
							key={entry.id}
							entry={entry}
							now={dashboard.hub.now}
						/>
					))}
				</ul>
			</div>
		</div>
	)
}

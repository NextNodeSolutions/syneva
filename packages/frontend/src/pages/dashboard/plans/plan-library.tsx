import { plansByProject } from '@entities/hub/plan-model'
import { sectionLabel } from '@shared/ui/section-label.styles'
import { TextLink } from '@shared/ui/text-link'
import * as stylex from '@stylexjs/stylex'

import { displayRoot, plural, relativeTime } from '../format'
import { closedList } from '../react/closed-desks.styles'

import { planLibrary } from './plan-library.styles'
import { PlanStatusTag } from './plan-status'

import type { Plan, PlanProject } from '@entities/hub/plan-model'
import type { PlansView } from '@entities/hub/use-plans'
import type { ReactElement } from 'react'

const EMPTY_LIBRARY =
	'No plan kept yet. Your agent adds one with syneva open plan <path>: every version it posts lands here.'

function PlanRow({ plan, now }: { plan: Plan; now: number }): ReactElement {
	const versions = plural(plan.versions.length, 'version')
	const last = relativeTime(plan.updatedAt, now)
	return (
		<li {...stylex.props(planLibrary.row)} data-enter="rise">
			<span>
				<span {...stylex.props(planLibrary.title)}>{plan.title}</span>
				{plan.summary && (
					<span {...stylex.props(planLibrary.summary)}>
						{plan.summary}
					</span>
				)}
				<span {...stylex.props(planLibrary.path)} title={plan.path}>
					{plan.path}
				</span>
			</span>
			<PlanStatusTag status={plan.status} />
			<span {...stylex.props(planLibrary.figure)}>{versions}</span>
			<span {...stylex.props(planLibrary.figure)}>{last}</span>
			<span {...stylex.props(planLibrary.desk)}>
				{plan.deskPath && (
					<TextLink href={plan.deskPath} small arrow>
						Desk
					</TextLink>
				)}
			</span>
			<span {...stylex.props(planLibrary.folded)}>
				{`${versions} · moved ${last}`}
			</span>
		</li>
	)
}

function ProjectPlans({
	project,
	now,
}: {
	project: PlanProject
	now: number
}): ReactElement {
	return (
		<section {...stylex.props(planLibrary.project)}>
			<h3 {...stylex.props(sectionLabel.base, planLibrary.projectHead)}>
				<span {...stylex.props(planLibrary.projectName)}>
					{project.project}
				</span>
				<span title={project.root}>{displayRoot(project.root)}</span>
			</h3>
			<ul>
				{project.plans.map(plan => (
					<PlanRow key={plan.id} plan={plan} now={now} />
				))}
			</ul>
		</section>
	)
}

// The plans the hub keeps, by repository: each with where it stands and how many versions the
// agent posted. A plan outlives its desk; the desk link shows while one reviews it.
export function PlanLibrary({
	view,
	now,
}: {
	view: PlansView
	now: number
}): ReactElement | null {
	if (view.phase === 'loading') return null
	return (
		<section
			{...stylex.props(closedList.root, planLibrary.root)}
			aria-labelledby="library-title"
			data-enter="fade"
		>
			<div {...stylex.props(closedList.head)}>
				<h2 id="library-title" {...stylex.props(closedList.title)}>
					Library
				</h2>
				{view.phase === 'read' && (
					<span {...stylex.props(closedList.count)}>
						{view.plans.length}
					</span>
				)}
			</div>
			{view.phase === 'failed' && (
				<p {...stylex.props(planLibrary.empty)}>
					The hub did not answer for its plan library.
				</p>
			)}
			{view.phase === 'read' && !view.plans.length && (
				<p {...stylex.props(planLibrary.empty)}>{EMPTY_LIBRARY}</p>
			)}
			{view.phase === 'read' &&
				plansByProject(view.plans).map(project => (
					<ProjectPlans
						key={project.projectId}
						project={project}
						now={now}
					/>
				))}
		</section>
	)
}

import { useMemo } from 'react'

import { deskOfPlan, plansByProject } from '@entities/hub/plan-model'
import { TURNS, turnOf } from '@entities/hub/turn'
import { AppLink } from '@shared/ui/app-link'
import { sectionLabel } from '@shared/ui/section-label.styles'
import * as stylex from '@stylexjs/stylex'
import { planPagePath } from '@syneva/contracts/routes'
import { focus } from '@syneva/design-system/controls.styles'

import { displayRoot, plural, relativeTime } from '../format'

import { planLibrary } from './plan-library.styles'
import { planRowMarker } from './plan-library.stylex'
import { PlanReviewAction } from './plan-review-action'
import { PlanStatusTag } from './plan-status'
import { PlanTurn } from './plan-turn'

import type { HubDesk } from '@entities/hub/model'
import type { Plan, PlanDeskJoin, PlanProject } from '@entities/hub/plan-model'
import type { PlansView } from '@entities/hub/use-plans'
import type { ReactElement } from 'react'

const EMPTY_LIBRARY =
	'No plan kept yet. Your agent adds one with syneva open plan <path>, or the /plan prompt: every version it posts lands here.'

type Row = PlanDeskJoin & { plan: Plan }

const NO_PLANS: readonly Plan[] = []

// A plan's place in its project: the ones waiting on the reviewer first, in the order the
// round runs, then the ones with no desk open; the most recently moved first within each.
function rank(row: Row): number {
	return row.desk ? TURNS.indexOf(turnOf(row.desk)) : TURNS.length
}

type ProjectRows = { project: PlanProject; rows: Row[] }

function rowsOf(project: PlanProject, desks: readonly HubDesk[]): Row[] {
	return project.plans
		.map(plan => ({ plan, ...deskOfPlan(plan, desks) }))
		.toSorted(
			(a, b) =>
				rank(a) - rank(b) ||
				b.plan.updatedAt.localeCompare(a.plan.updatedAt),
		)
}

function PlanRow({ row, now }: { row: Row; now: number }): ReactElement {
	const { plan, desk, path } = row
	const versions = plural(plan.versions.length, 'version')
	const last = relativeTime(plan.updatedAt, now)
	return (
		<li {...stylex.props(planLibrary.row, planRowMarker)} data-enter="rise">
			<span>
				<AppLink
					href={planPagePath(plan.id)}
					css={[focus.ring, planLibrary.title, planLibrary.titleLink]}
				>
					{plan.title}
					<span
						aria-hidden="true"
						{...stylex.props(planLibrary.stretch)}
					/>
				</AppLink>
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
			<PlanTurn desk={desk} />
			<span
				{...stylex.props(planLibrary.figure)}
			>{`${versions} · ${last}`}</span>
			<span {...stylex.props(planLibrary.action)}>
				<PlanReviewAction plan={plan} tone="outlined" deskPath={path} />
			</span>
			<span {...stylex.props(planLibrary.folded)}>
				{`${versions} · moved ${last}`}
			</span>
		</li>
	)
}

// The library by repository, each plan joined to its live desk and ranked.
function shelvesOf(
	plans: readonly Plan[],
	desks: readonly HubDesk[],
): ProjectRows[] {
	return plansByProject(plans).map(project => ({
		project,
		rows: rowsOf(project, desks),
	}))
}

function ProjectPlans({
	shelf: { project, rows },
	now,
}: {
	shelf: ProjectRows
	now: number
}): ReactElement {
	return (
		<section {...stylex.props(planLibrary.project)}>
			<h2 {...stylex.props(sectionLabel.base, planLibrary.projectHead)}>
				<span {...stylex.props(planLibrary.projectName)}>
					{project.project}
				</span>
				<span title={project.root}>{displayRoot(project.root)}</span>
			</h2>
			<ul>
				{rows.map(row => (
					<PlanRow key={row.plan.id} row={row} now={now} />
				))}
			</ul>
		</section>
	)
}

// The plans the hub keeps, by repository: each with its status, where its review stands on its
// desk, how many versions the agent posted, and the way to review it. A plan's title opens its
// page; it outlives its desk, which Review opens again.
export function PlanLibrary({
	view,
	desks,
	now,
}: {
	view: PlansView
	desks: readonly HubDesk[]
	now: number
}): ReactElement | null {
	const plans = view.phase === 'read' ? view.plans : NO_PLANS
	// Grouped and joined again only when the library or the listing moves, not on every render
	// the dashboard's other state brings.
	const shelves = useMemo(() => shelvesOf(plans, desks), [plans, desks])
	if (view.phase === 'loading') return null
	if (view.phase === 'failed')
		return (
			<p {...stylex.props(planLibrary.empty)}>
				The hub did not answer for its plan library. It reads again on
				its own.
			</p>
		)
	if (!plans.length)
		return <p {...stylex.props(planLibrary.empty)}>{EMPTY_LIBRARY}</p>
	return (
		<div {...stylex.props(planLibrary.root)} data-enter="fade">
			{shelves.map(shelf => (
				<ProjectPlans
					key={shelf.project.projectId}
					shelf={shelf}
					now={now}
				/>
			))}
		</div>
	)
}

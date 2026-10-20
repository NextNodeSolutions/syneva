import { latestVersion } from '@entities/hub/plan-model'
import { AppLink } from '@shared/ui/app-link'
import * as stylex from '@stylexjs/stylex'
import { DASHBOARD_PATHS } from '@syneva/contracts/routes'

import { shortDay } from '../format'

import { planPage } from './plan-page.styles'
import { PlanStatusTag } from './plan-status'

import type { Plan } from '@entities/hub/plan-model'
import type { ReactElement, ReactNode } from 'react'
import type { PlanSection } from './plan-document'

// Where the plan belongs and where it stands.
function PlanEyebrow({ plan }: { plan: Plan }): ReactElement {
	const latest = latestVersion(plan)
	return (
		<p {...stylex.props(planPage.eyebrow)} data-enter="rise">
			<AppLink href={DASHBOARD_PATHS.plans} css={planPage.crumb}>
				Plans
			</AppLink>
			<span>{plan.project}</span>
			{latest && (
				<span>
					{`v${String(latest.number)} · ${shortDay(latest.postedAt)}`}
				</span>
			)}
			<PlanStatusTag status={plan.status} />
		</p>
	)
}

const MIN_SECTIONS = 2

// The way through the plan's sections, each under its number; a single section needs none.
// A plain fragment link: the browser scrolls the page column to the band, and the router
// leaves a fragment move alone (shared/lib/router.ts).
function PlanToc({
	sections,
}: {
	sections: readonly PlanSection[]
}): ReactElement | null {
	if (sections.length < MIN_SECTIONS) return null
	return (
		<nav aria-label="Sections" {...stylex.props(planPage.toc)}>
			{sections.map(section => (
				<a
					key={section.id}
					href={`#${section.id}`}
					{...stylex.props(planPage.tocLink)}
				>
					<span {...stylex.props(planPage.tocNumber)}>
						{section.number}
					</span>
					{section.title}
				</a>
			))}
		</nav>
	)
}

// The plan's head, as an RFC opens: where it belongs and where it stands, its title, what it
// is about, the way through its sections, and what the reviewer can do with it; its versions
// and where it lives beside it.
export function PlanHero({
	plan,
	sections,
	meta,
	children,
}: {
	plan: Plan
	sections: readonly PlanSection[]
	meta: ReactNode
	children: ReactNode
}): ReactElement {
	return (
		<header {...stylex.props(planPage.hero)}>
			<div {...stylex.props(planPage.heroFrame)}>
				<div {...stylex.props(planPage.heroMain)}>
					<PlanEyebrow plan={plan} />
					<h1 {...stylex.props(planPage.title)} data-enter="rise">
						{plan.title}
					</h1>
					{plan.summary && (
						<p {...stylex.props(planPage.lede)} data-enter="rise">
							{plan.summary}
						</p>
					)}
					<PlanToc sections={sections} />
					{children}
				</div>
				<aside
					{...stylex.props(planPage.heroMeta)}
					aria-label="Versions"
				>
					{meta}
				</aside>
			</div>
		</header>
	)
}

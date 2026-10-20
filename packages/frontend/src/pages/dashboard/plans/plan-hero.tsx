import { latestVersion } from '@entities/hub/plan-model'
import { AppLink } from '@shared/ui/app-link'
import * as stylex from '@stylexjs/stylex'
import { DASHBOARD_PATHS } from '@syneva/contracts/routes'

import { SHORT_DATE } from '../format'

import { planPage } from './plan-page.styles'
import { PlanStatusTag } from './plan-status'

import type { Plan } from '@entities/hub/plan-model'
import type { MouseEvent, ReactElement, ReactNode } from 'react'
import type { PlanSection } from './plan-document'

// A section link scrolls to its heading itself: a fragment navigation would reach the router's
// Back/Forward handling, which restores the page's scroll and undoes the jump. The href stays
// for a copied or opened link.
function jumpTo(event: MouseEvent<HTMLAnchorElement>, id: string): void {
	event.preventDefault()
	const isCalm = window.matchMedia('(prefers-reduced-motion: reduce)').matches
	document.getElementById(id)?.scrollIntoView({
		behavior: isCalm ? 'auto' : 'smooth',
		block: 'start',
	})
}

// The plan's head, as an RFC opens: where it belongs and where it stands, its title, what it
// is about, the way through its sections, and what the reviewer can do with it.
export function PlanHero({
	plan,
	sections,
	children,
}: {
	plan: Plan
	sections: readonly PlanSection[]
	children: ReactNode
}): ReactElement {
	const latest = latestVersion(plan)
	return (
		<header {...stylex.props(planPage.hero)}>
			<p {...stylex.props(planPage.eyebrow)} data-enter="rise">
				<AppLink href={DASHBOARD_PATHS.plans} css={planPage.crumb}>
					Plans
				</AppLink>
				<span>{plan.project}</span>
				{latest && (
					<span>
						{`v${String(latest.number)} · ${SHORT_DATE.format(new Date(latest.postedAt))}`}
					</span>
				)}
				<PlanStatusTag status={plan.status} />
			</p>
			<h1 {...stylex.props(planPage.title)} data-enter="rise">
				{plan.title}
			</h1>
			{plan.summary && (
				<p {...stylex.props(planPage.lede)} data-enter="rise">
					{plan.summary}
				</p>
			)}
			{sections.length > 1 && (
				<nav aria-label="Sections" {...stylex.props(planPage.toc)}>
					{sections.map(section => (
						<a
							key={section.id}
							href={`#${section.id}`}
							onClick={event => jumpTo(event, section.id)}
							{...stylex.props(planPage.tocLink)}
						>
							{section.title}
						</a>
					))}
				</nav>
			)}
			{children}
		</header>
	)
}

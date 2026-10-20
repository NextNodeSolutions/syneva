import { sectionLabel } from '@shared/ui/section-label.styles'
import * as stylex from '@stylexjs/stylex'

import { displayRoot, shortDay } from '../format'

import { planVersions } from './plan-versions.styles'

import type { Plan, PlanVersion } from '@entities/hub/plan-model'
import type { ReactElement } from 'react'

function VersionItem({
	version,
	isRead,
	onRead,
}: {
	version: PlanVersion
	isRead: boolean
	onRead: (version: number) => void
}): ReactElement {
	return (
		<li>
			<button
				type="button"
				aria-current={isRead || undefined}
				onClick={() => onRead(version.number)}
				{...stylex.props(
					planVersions.item,
					isRead && planVersions.current,
				)}
			>
				<span {...stylex.props(planVersions.number)}>
					{`v${String(version.number)}`}
				</span>
				<span {...stylex.props(planVersions.meta)}>
					{shortDay(version.postedAt)}
					{version.approvedAt && (
						<span {...stylex.props(planVersions.approved)}>
							{` · approved ${shortDay(version.approvedAt)}`}
						</span>
					)}
				</span>
			</button>
		</li>
	)
}

// Every version the agent posted, newest first; choosing one reads it in place of the latest.
export function PlanVersions({
	plan,
	reading,
	onRead,
}: {
	plan: Plan
	reading: number
	onRead: (version: number) => void
}): ReactElement {
	return (
		<section aria-labelledby="plan-versions">
			<h2
				id="plan-versions"
				{...stylex.props(sectionLabel.base, planVersions.head)}
			>
				Versions
			</h2>
			<ul>
				{plan.versions.toReversed().map(version => (
					<VersionItem
						key={version.number}
						version={version}
						isRead={version.number === reading}
						onRead={onRead}
					/>
				))}
			</ul>
		</section>
	)
}

function Fact({ label, text }: { label: string; text: string }): ReactElement {
	return (
		<div {...stylex.props(planVersions.fact)}>
			<span {...stylex.props(sectionLabel.base)}>{label}</span>
			<span {...stylex.props(planVersions.factValue)} title={text}>
				{text}
			</span>
		</div>
	)
}

// Where the plan lives and since when the hub keeps it.
export function PlanFacts({ plan }: { plan: Plan }): ReactElement {
	return (
		<div {...stylex.props(planVersions.facts)}>
			<Fact label="File" text={plan.path} />
			<Fact label="Repository" text={displayRoot(plan.root)} />
			<Fact label="Kept since" text={shortDay(plan.createdAt)} />
		</div>
	)
}

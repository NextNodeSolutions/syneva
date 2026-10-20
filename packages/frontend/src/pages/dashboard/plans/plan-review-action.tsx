import { Button } from '@shared/ui/button'
import { ButtonLink } from '@shared/ui/button-link'
import * as stylex from '@stylexjs/stylex'

import { planLibrary } from './plan-library.styles'
import { usePlanReview } from './use-plan-review'

import type { Plan } from '@entities/hub/plan-model'
import type { ReactElement } from 'react'

// Where a plan is reviewed: its desk, open now or opened again. The desk is the review itself
// (comments, verdicts, the Send that approves a version), not a view of the file. `deskPath` is
// the live desk the caller resolved (deskOfPlan): linked when there is one, opened when not.
export function PlanReviewAction({
	plan,
	tone,
	deskPath,
}: {
	plan: Plan
	tone: 'primary' | 'outlined'
	deskPath: string | null
}): ReactElement {
	const { busy, failure, review } = usePlanReview(plan)
	if (deskPath)
		return (
			<ButtonLink href={deskPath} tone={tone} size="small" arrow>
				Review
			</ButtonLink>
		)
	return (
		<>
			<Button
				tone={tone}
				size="small"
				busy={busy}
				disabled={busy}
				onClick={() => void review()}
			>
				Review
			</Button>
			{failure && (
				<span role="alert" {...stylex.props(planLibrary.failure)}>
					{failure}
				</span>
			)}
		</>
	)
}

import { Button } from '@shared/ui/button'
import { ButtonLink } from '@shared/ui/button-link'
import * as stylex from '@stylexjs/stylex'

import { planLibrary } from './plan-library.styles'
import { usePlanReview } from './use-plan-review'

import type { Plan } from '@entities/hub/plan-model'
import type { ReactElement } from 'react'

// Where a plan is reviewed: its desk, open now or opened again. The desk is the review itself
// (comments, verdicts, the Send that approves a version), not a view of the file.
// `deskPath` is the live desk the caller already knows of (the listing's own poll), ahead of the
// library's, which can lag it: a desk still open is never reopened (a reload) to be reached.
export function PlanReviewAction({
	plan,
	tone,
	deskPath = plan.deskPath,
}: {
	plan: Plan
	tone: 'primary' | 'outlined'
	deskPath?: string | null | undefined
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

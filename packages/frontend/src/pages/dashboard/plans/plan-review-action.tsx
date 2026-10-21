import { hubOfId } from '@entities/hub/hub-ids'
import { Button } from '@shared/ui/button'
import { ButtonLink } from '@shared/ui/button-link'
import * as stylex from '@stylexjs/stylex'

import { useOpenAndGo } from '../use-open-and-go'

import { planLibrary } from './plan-library.styles'

import type { NewDeskInput } from '@entities/hub/model'
import type { Plan } from '@entities/hub/plan-model'
import type { ReactElement } from 'react'

// A plan whose desk closed is reviewed again on the same desk: the hub opens the file as a plan
// from the same absolute path the CLI gave it, so the desk's id and session come out the same
// and its saved review merges back.
function reviewInput(plan: Plan): NewDeskInput {
	return {
		root: plan.root,
		mode: 'file',
		staged: false,
		target: `${plan.root}/${plan.path}`,
		plan: true,
	}
}

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
	const { busyKey, failures, open } = useOpenAndGo()
	if (deskPath)
		return (
			<ButtonLink href={deskPath} tone={tone} size="small" arrow>
				Review
			</ButtonLink>
		)
	const busy = busyKey !== null
	const failure = failures.get(plan.id)
	return (
		<>
			<Button
				tone={tone}
				size="small"
				busy={busy}
				disabled={busy}
				onClick={() =>
					void open(plan.id, reviewInput(plan), hubOfId(plan.id))
				}
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

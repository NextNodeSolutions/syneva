import * as stylex from '@stylexjs/stylex'

import { planStatus } from './plan-status.styles'

import type { PlanStatus } from '@entities/hub/plan-model'
import type { ReactElement } from 'react'

export function PlanStatusTag({
	status,
}: {
	status: PlanStatus
}): ReactElement {
	return (
		<span {...stylex.props(planStatus.tag, planStatus[status])}>
			<span {...stylex.props(planStatus.dot)} aria-hidden="true" />
			{status}
		</span>
	)
}

import * as stylex from '@stylexjs/stylex'

import { churnCounts } from './churn-counts.styles'

import type { ReactElement } from 'react'

type ChurnCountsProps = {
	additions: number
	deletions: number
}

export function ChurnCounts({
	additions,
	deletions,
}: ChurnCountsProps): ReactElement {
	return (
		<span
			{...stylex.props(churnCounts.counts)}
			role="img"
			aria-label={`${additions} added, ${deletions} removed`}
		>
			<span {...stylex.props(churnCounts.added)}>+{additions}</span>
			<span {...stylex.props(churnCounts.removed)}>-{deletions}</span>
		</span>
	)
}

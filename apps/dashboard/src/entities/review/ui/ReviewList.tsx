import * as stylex from '@stylexjs/stylex'

import { reviewList } from './review-list.styles'
import { ReviewRow } from './ReviewRow'

import type { ProjectRef, ReviewSummary } from '@syneva/contracts/projects'
import type { ReactElement } from 'react'

type ReviewListProps = {
	project: ProjectRef
	reviews: readonly ReviewSummary[]
}

export function ReviewList({
	project,
	reviews,
}: ReviewListProps): ReactElement {
	if (!reviews.length)
		return <p {...stylex.props(reviewList.empty)}>No open pull request.</p>
	return (
		<ol {...stylex.props(reviewList.list)}>
			{reviews.map(review => (
				<li key={review.number} {...stylex.props(reviewList.item)}>
					<ReviewRow project={project} review={review} />
				</li>
			))}
		</ol>
	)
}

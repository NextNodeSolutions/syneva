import { AppLink } from '@shared/router/AppLink'
import { PAGE_ROUTES } from '@shared/routes/page-routes'
import * as stylex from '@stylexjs/stylex'
import { fillPath } from '@syneva/contracts/paths'
import { caption } from '@syneva/design-system/controls.styles'

import { ChurnCounts } from './ChurnCounts'
import { DraftTag } from './DraftTag'
import { reviewRow } from './review-row.styles'
import { ReviewMeta } from './ReviewMeta'

import type { ProjectRef, ReviewSummary } from '@syneva/contracts/projects'
import type { ReactElement } from 'react'

type ReviewRowProps = {
	project: ProjectRef
	review: ReviewSummary
}

export function ReviewRow({ project, review }: ReviewRowProps): ReactElement {
	const { number, title, isDraft, churn } = review
	return (
		<AppLink
			to={fillPath(PAGE_ROUTES.review, { ...project, number })}
			{...stylex.props(reviewRow.row)}
		>
			<span {...stylex.props(reviewRow.title)}>
				{title}
				{isDraft && <DraftTag />}
			</span>
			<ChurnCounts
				additions={churn.additions}
				deletions={churn.deletions}
			/>
			<span {...stylex.props(caption.base, reviewRow.meta)}>
				<ReviewMeta review={review} />
			</span>
		</AppLink>
	)
}

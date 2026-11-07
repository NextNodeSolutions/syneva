import { projectPath } from '@entities/project/model/project-path'
import { useReview } from '@entities/review/api/use-review'
import { ChurnCounts } from '@entities/review/ui/ChurnCounts'
import { DraftTag } from '@entities/review/ui/DraftTag'
import { ReviewMeta } from '@entities/review/ui/ReviewMeta'
import { AppLink } from '@shared/router/AppLink'
import { DocumentTitle } from '@shared/ui/DocumentTitle'
import { PageBody } from '@shared/ui/PageBody'
import { PageHead } from '@shared/ui/PageHead'
import { QueryStatus } from '@shared/ui/QueryStatus'
import * as stylex from '@stylexjs/stylex'
import { fullName } from '@syneva/contracts/projects'
import { ReviewCode } from '@widgets/review-code/ui/ReviewCode'

import { reviewPage } from './review-page.styles'

import type { ReviewRef } from '@syneva/contracts/projects'
import type { ReactElement } from 'react'

export function ReviewPage({ review }: { review: ReviewRef }): ReactElement {
	const code = useReview(review)
	const summary = code.data?.review
	const heading = summary?.title ?? `Pull request #${review.number}`
	return (
		<>
			<DocumentTitle title={heading} />
			<PageHead
				eyebrow={
					<AppLink
						to={projectPath(review)}
						{...stylex.props(reviewPage.projectLink)}
					>
						{fullName(review)}
					</AppLink>
				}
				title={heading}
				lede={summary && <ReviewMeta review={summary} />}
			>
				{summary?.isDraft && <DraftTag />}
				{summary && (
					<ChurnCounts
						additions={summary.churn.additions}
						deletions={summary.churn.deletions}
					/>
				)}
			</PageHead>
			<PageBody>
				{code.isSuccess ? (
					<ReviewCode patch={code.data.diff} />
				) : (
					<QueryStatus
						error={code.error}
						pendingTitle="Loading the pull request…"
						errorTitle="The pull request did not load."
					/>
				)}
			</PageBody>
		</>
	)
}

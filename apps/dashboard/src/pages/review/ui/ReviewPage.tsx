import { useReview } from '@entities/review/api/use-review'
import { DocumentTitle } from '@shared/ui/DocumentTitle'
import { PageBody } from '@shared/ui/PageBody'
import { QueryStatus } from '@shared/ui/QueryStatus'
import { ReviewDesk } from '@widgets/review-code/ui/ReviewDesk'

import type { ReviewRef } from '@syneva/contracts/projects'
import type { ReactElement } from 'react'

export function ReviewPage({ review }: { review: ReviewRef }): ReactElement {
	const code = useReview(review)
	const heading = code.data?.review.title ?? `Pull request #${review.number}`
	return (
		<>
			<DocumentTitle title={heading} />
			{code.isSuccess ? (
				<ReviewDesk code={code.data} />
			) : (
				<PageBody>
					<QueryStatus
						error={code.error}
						pendingTitle="Loading the pull request…"
						errorTitle="The pull request did not load."
					/>
				</PageBody>
			)}
		</>
	)
}

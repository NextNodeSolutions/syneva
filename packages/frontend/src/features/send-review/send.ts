import { sendReview } from '@entities/review/api'
import { reviewerSlice } from '@entities/review/save'
import { featureCtx } from '@features/context'

export async function sendReviewToAgent(overallNote = ''): Promise<void> {
	const { sent } = await sendReview({
		...reviewerSlice(featureCtx().requireState()),
		overallNote,
	})
	if (sent) {
		featureCtx().S.awaitingAgent = true
		featureCtx().toast('Sent to agent')
		return
	}
	featureCtx().toast('Could not send review')
}

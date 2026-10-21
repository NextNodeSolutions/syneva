import { browserDomainComment } from '../application/browser-state.js'
import { hash } from '../domain/identity.js'

import type { DeskPulse, PartialDeskPulse } from '@syneva/contracts/bridge'
import type { PollPayload } from '@syneva/contracts/browser'
import type { ReviewState } from '../domain/review.js'
import type { DeskContext } from './context.js'

// The review half of what a desk tab watches between two /state reads: git-free and tiny, the
// guide and the conversation, never the changes (they ride /state, fetched when baseDiffHash
// moves). One capture: the fields come from one root, never stitched from two revisions.
export function pollPayload(state: ReviewState): PollPayload {
	return {
		baseDiffHash: state.baseDiffHash,
		guide: state.guide,
		guideResolution: state.guideResolution,
		guideExpected: state.guideExpected,
		comments: state.comments,
		domainComments: (state.domainComments ?? []).map(browserDomainComment),
	}
}

// A desk's pulse: what `/poll` serves (the review half and the desk's status) and the desk's
// instance id, which a stream carries where `/poll` compares it through its query. GET …/pulse
// serves it whole.
export function deskPulse(ctx: DeskContext): DeskPulse {
	return {
		...pollPayload(ctx.state),
		...ctx.status(),
		serverInstanceId: ctx.instanceId,
	}
}

// The pulse a frame carries when the whole one would not fit (contracts' PartialDeskPulse): its
// head, and the digest of everything else - whatever DeskPulse holds beyond the head, a field
// added later included - so the digest moves exactly when a part left out does, and a status
// change alone never sends a tab to read the whole again.
export function partialPulse(pulse: DeskPulse): PartialDeskPulse {
	const {
		baseDiffHash,
		guideExpected,
		serverInstanceId,
		agentActivity,
		agentListening,
		queuedQuestions,
		queuedReviews,
		...leftOut
	} = pulse
	return {
		baseDiffHash,
		guideExpected,
		serverInstanceId,
		agentActivity,
		agentListening,
		queuedQuestions,
		queuedReviews,
		partial: { digest: hash(JSON.stringify(leftOut)) },
	}
}

import type { HubDesk } from './model'

// The agent's own last line and when it posted it.
export type Activity = NonNullable<HubDesk['agentActivity']>

// Where a desk's round stands, read from the hub's own fields only: nothing (like "the agent
// is answering") is inferred beyond what they say.
// - sent / asked: a review or questions went out and no agent has picked them up (queued*).
// - working: the agent posted a line of activity and is not parked on an await. The hub's
//   TTL clears the line after about 90s.
// - empty: the desk has no changes to review yet; `listening` says whether an agent waits.
// - yours: an `await` is parked, so the agent is blocked on the reviewer. It outranks the
//   agent's activity line, which it keeps to show what the agent last said.
// - idle: no agent listening and nothing in flight: the review waits for its reviewer.
export type DeskStage =
	| { kind: 'sent' }
	| { kind: 'asked'; questions: number }
	| { kind: 'working'; activity: Activity }
	| { kind: 'empty'; listening: boolean }
	| { kind: 'yours'; activity: Activity | null }
	| { kind: 'idle' }

// The first rule that holds wins; this order is the contract every label and count reads.
export function deskStage(desk: HubDesk): DeskStage {
	if (desk.queuedReviews > 0) return { kind: 'sent' }
	if (desk.queuedQuestions > 0)
		return { kind: 'asked', questions: desk.queuedQuestions }
	if (desk.agentActivity && !desk.agentListening)
		return { kind: 'working', activity: desk.agentActivity }
	if (desk.empty) return { kind: 'empty', listening: desk.agentListening }
	if (desk.agentListening)
		return { kind: 'yours', activity: desk.agentActivity }
	return { kind: 'idle' }
}

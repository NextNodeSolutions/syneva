import type { HubDesk } from './model'

export type Activity = NonNullable<HubDesk['agentActivity']>

// Read from the hub's own fields only - nothing is inferred beyond what they say; the hub's TTL clears the activity line after about 90s.
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

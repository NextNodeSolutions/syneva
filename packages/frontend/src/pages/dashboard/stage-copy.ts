import type { Activity, DeskStage } from '@entities/hub/stage'
import type { DotTone } from '@shared/ui/live-dot'

export type StageCopy = {
	dot: { tone: DotTone; hollow?: boolean; live?: boolean }
	label: string
	tone: 'ink' | 'accent' | 'muted'
	isBadge?: boolean
	activityAt?: string | undefined
	detail: { kind: 'words'; body: string } | { kind: 'note'; text: string }
}

const note = (text: string): StageCopy['detail'] => ({ kind: 'note', text })

const UNCLAIMED = note('No agent has picked it up yet.')

const sent = (label: string): StageCopy => ({
	dot: { tone: 'petrol', hollow: true },
	label,
	tone: 'ink',
	detail: UNCLAIMED,
})

const working = (activity: Activity): StageCopy => ({
	dot: { tone: 'signal', live: true },
	label: 'Agent working',
	tone: 'accent',
	activityAt: activity.at,
	detail: { kind: 'words', body: activity.body },
})

const waiting = (text: string): StageCopy => ({
	dot: { tone: 'neutral', hollow: true },
	label: 'Waiting for changes',
	tone: 'muted',
	detail: note(text),
})

const WAITING_ON_LISTENER = waiting(
	'Your agent is listening. Changes appear when it reloads.',
)
const WAITING = waiting('Changes appear when your agent reloads the desk.')

const yours = (activity: Activity | null): StageCopy => ({
	dot: { tone: 'petrol' },
	label: 'Your turn',
	tone: 'accent',
	isBadge: true,
	activityAt: activity?.at,
	detail: activity
		? { kind: 'words', body: activity.body }
		: note('Your agent is waiting for your review.'),
})

const IDLE: StageCopy = {
	dot: { tone: 'neutral' },
	label: 'No agent listening',
	tone: 'muted',
	detail: note('Review any time. Send waits for an agent.'),
}

// One reading per stage: every word restates a field the hub reported, nothing is inferred (the truth model is entities/hub/stage.ts).
export function stageCopy(stage: DeskStage): StageCopy {
	if (stage.kind === 'sent') return sent('Review sent')
	if (stage.kind === 'asked')
		return sent(
			stage.questions === 1
				? 'Question sent'
				: `${stage.questions} questions sent`,
		)
	if (stage.kind === 'working') return working(stage.activity)
	if (stage.kind === 'empty')
		return stage.listening ? WAITING_ON_LISTENER : WAITING
	if (stage.kind === 'yours') return yours(stage.activity)
	return IDLE
}

import type { Activity, DeskStage } from '@entities/hub/stage'
import type { DotTone } from '@shared/ui/live-dot'

// How a stage reads in its row: the square before it, the label (in ink, petrol or muted; as
// the site's index badge when the turn is the reviewer's, the one tinted mark in the list),
// the time of the agent's last line when the label leans on it, and the line under it - the
// agent's own words, quoted, or a note of ours.
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

// Sent work waits for an agent to claim it: a hollow petrol square, ink words.
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

// An empty desk waits for the agent's reload, whether or not an agent is listening yet.
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

// One reading per stage, in the truth model's terms (entities/hub/stage.ts): every word
// restates a field the hub reported, nothing is inferred.
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

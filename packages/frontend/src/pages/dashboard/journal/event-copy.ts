import { plural, SHORT_DATE } from '../format'

import type { JournalEvent, RoundSent } from '@entities/hub/journal'
import type { DotTone } from '@shared/ui/live-dot'

// What a journal event says in the feed: its square (the system's signals: petrol for the
// agent's side and the reviewer's questions, green for a verdict sent, neutral for the desk's
// own comings and goings) and its sentence. The desk it is about is named beside it.
export type EventLine = { tone: DotTone; isHollow: boolean; text: string }

// A round's verdicts in the desk's own words (Keep, Undo, Request change), the empty ones left
// out; a Send with no verdict at all still went out.
function verdicts(round: RoundSent): string {
	const parts = [
		round.accepted ? `${round.accepted} kept` : '',
		round.rejected ? `${round.rejected} undone` : '',
		round.requestedChanges
			? `${plural(round.requestedChanges, 'change')} requested`
			: '',
		round.openQuestions ? plural(round.openQuestions, 'open question') : '',
	].filter(Boolean)
	return parts.length ? ` · ${parts.join(', ')}` : ''
}

export function eventLine(event: JournalEvent): EventLine {
	const files = 'files' in event ? plural(event.files, 'file') : ''
	if (event.kind === 'desk-opened')
		return {
			tone: 'neutral',
			isHollow: false,
			text: `Desk opened · ${files}`,
		}
	if (event.kind === 'desk-reloaded')
		return {
			tone: 'petrol',
			isHollow: false,
			text: `Agent reloaded · ${files}`,
		}
	if (event.kind === 'round-sent')
		return {
			tone: 'green',
			isHollow: false,
			text: `Round ${event.round} sent${verdicts(event)}`,
		}
	if (event.kind === 'round-picked')
		return {
			tone: 'petrol',
			isHollow: true,
			text: `Agent picked up round ${event.round}`,
		}
	if (event.kind === 'question-asked')
		return {
			tone: 'petrol',
			isHollow: true,
			text: `You asked ${plural(event.questions, 'question')}`,
		}
	if (event.kind === 'agent-replied')
		return { tone: 'petrol', isHollow: false, text: 'Agent replied' }
	return {
		tone: 'neutral',
		isHollow: true,
		text: `Desk closed · ${event.approvedFiles}/${files} approved`,
	}
}

const TIME = new Intl.DateTimeFormat(undefined, {
	hour: '2-digit',
	minute: '2-digit',
})

// When it happened, as a feed reads it: the time of day for today, the date before that.
export function eventTime(at: string, now: number): string {
	const when = new Date(at)
	return when.toDateString() === new Date(now).toDateString()
		? TIME.format(when)
		: SHORT_DATE.format(when)
}

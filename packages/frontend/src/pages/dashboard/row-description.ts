import { modeLabel, plural, relativeTime } from './format'

import type { HubDesk } from '@entities/hub/model'
import type { StageCopy } from './stage-copy'

// A part read as a sentence: it ends on a full stop unless it already ends on one of its own
// (a note of ours; the agent's quoted words take one after the quote).
function sentence(text: string): string {
	return /[.!?]$/.test(text) ? text : `${text}.`
}

function stageLine(copy: StageCopy, now: number): string {
	if (!copy.activityAt) return copy.label
	return `${copy.label} · ${relativeTime(copy.activityAt, now)}`
}

function stageDetail(copy: StageCopy): string {
	const { detail } = copy
	return detail.kind === 'words' ? `"${detail.body}"` : detail.text
}

function approvals(desk: HubDesk): string {
	if (desk.empty) return '0 files'
	const noun = desk.files === 1 ? 'file' : 'files'
	return `${desk.approvedFiles} of ${desk.files} ${noun} approved`
}

// The progress line's items as one clause, or null when the desk has none.
function progress(desk: HubDesk): string | null {
	const noun = desk.totalChanges === 1 ? 'change' : 'changes'
	const clauses = [
		desk.totalChanges > 0 &&
			`${desk.decidedChanges} of ${desk.totalChanges} ${noun} decided`,
		desk.openRequests > 0 &&
			`${plural(desk.openRequests, 'change')} requested`,
		desk.openQuestions > 0 &&
			`${plural(desk.openQuestions, 'question')} open`,
	].filter(clause => clause !== false)
	if (!clauses.length) return null
	return clauses.join(', ')
}

// What a screen reader hears on a row's link (its aria-describedby), in sentences: what the
// desk reviews and its age, where its round stands and what that means, then its review -
// "working tree · active just now · opened 2h ago. Your turn. Your agent is waiting for your
// review. 3 of 12 files approved. 18 of 40 changes decided, 2 changes requested." The row's
// visible parts are set in columns and annotations; read in a run they would lose their
// stops, so the sentence is written once here, from the same fields and words.
export function rowDescription(
	desk: HubDesk,
	copy: StageCopy,
	now: number,
): string {
	const meta = [
		modeLabel(desk),
		`active ${relativeTime(desk.lastActivityAt, now)}`,
		`opened ${relativeTime(desk.openedAt, now)}`,
	].join(' · ')
	return [
		meta,
		stageLine(copy, now),
		stageDetail(copy),
		approvals(desk),
		progress(desk),
	]
		.filter(part => part !== null)
		.map(sentence)
		.join(' ')
}

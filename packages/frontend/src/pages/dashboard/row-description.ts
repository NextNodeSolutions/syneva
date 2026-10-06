import { modeLabel, plural, relativeTime } from './format'

import type { HubDesk } from '@entities/hub/model'
import type { StageCopy } from './stage-copy'

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

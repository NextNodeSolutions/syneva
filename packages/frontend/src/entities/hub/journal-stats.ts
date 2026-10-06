import { isRoundSent } from './journal'

import type { JournalEvent, RoundSent } from './journal'

// What the journal says in numbers. Every figure is counted from events the hub recorded
// (never estimated): a fresh hub's journal is short, and a figure with nothing to count is
// null, which the page says in words rather than as a zero that reads as a fact.

export const DAY_MS = 86_400_000
export const WEEK_DAYS = 7

function startOfDay(at: number): number {
	const day = new Date(at)
	day.setHours(0, 0, 0, 0)
	return day.getTime()
}

// Rounds sent per calendar day (the viewer's own days), oldest first, today last.
export function roundsPerDay(
	events: readonly JournalEvent[],
	now: number,
	days: number,
): number[] {
	const today = startOfDay(now)
	const counts = Array.from({ length: days }, () => 0)
	for (const event of events) {
		if (!isRoundSent(event)) continue
		const back = Math.round(
			(today - startOfDay(Date.parse(event.at))) / DAY_MS,
		)
		const index = days - 1 - back
		if (index >= 0 && index < days) counts[index] = (counts[index] ?? 0) + 1
	}
	return counts
}

export function roundsSince(
	events: readonly JournalEvent[],
	since: number,
): RoundSent[] {
	return events.filter(
		(event): event is RoundSent =>
			isRoundSent(event) && Date.parse(event.at) >= since,
	)
}

// How long each round took the reviewer: from the moment its diff landed on the desk (the
// desk opened, or the agent reloaded it) to the Send. A Send with no landing since the
// previous one (a second Send over the same diff) measures nothing.
export function reviewTimes(events: readonly JournalEvent[]): number[] {
	const landings = new Map<string, number>()
	const times: number[] = []
	for (const event of events) {
		const at = Date.parse(event.at)
		if (event.kind === 'desk-opened' || event.kind === 'desk-reloaded')
			landings.set(event.deskId, at)
		if (!isRoundSent(event)) continue
		const landed = landings.get(event.deskId)
		if (landed) times.push(at - landed)
		landings.delete(event.deskId)
	}
	return times
}

// The middle value; with an even count, the mean of the two middle ones.
const HALVES = 2

export function median(values: readonly number[]): number | null {
	if (!values.length) return null
	const sorted = values.toSorted((a, b) => a - b)
	const middle = Math.floor(sorted.length / HALVES)
	const upper = sorted[middle] ?? 0
	if (sorted.length % HALVES) return upper
	return ((sorted[middle - 1] ?? upper) + upper) / HALVES
}

export type VerdictTotals = {
	accepted: number
	rejected: number
	requestedChanges: number
}

// The verdicts a set of rounds carried, summed.
export function verdictTotals(rounds: readonly RoundSent[]): VerdictTotals {
	const totals: VerdictTotals = {
		accepted: 0,
		rejected: 0,
		requestedChanges: 0,
	}
	for (const round of rounds) {
		totals.accepted += round.accepted
		totals.rejected += round.rejected
		totals.requestedChanges += round.requestedChanges
	}
	return totals
}

// The rounds each desk has been through, as its latest Send numbered it, in one pass: a desk
// with no Send yet has none (0 rounds).
export function latestRounds(
	events: readonly JournalEvent[],
): ReadonlyMap<string, number> {
	const rounds = new Map<string, number>()
	for (const event of events)
		if (isRoundSent(event)) rounds.set(event.deskId, event.round)
	return rounds
}

// When each desk's turns last began, from the journal: its diff landing (it opened, or the agent
// reloaded it), the agent's last reply (an answer hands the turn back to the reviewer as a
// landing does), the reviewer's last Send or question, and an agent's last pickup.
export type TurnStarts = {
	landed?: string
	replied?: string
	sent?: string
	picked?: string
}

export function turnStarts(
	events: readonly JournalEvent[],
): Map<string, TurnStarts> {
	const starts = new Map<string, TurnStarts>()
	const mark = (deskId: string, start: TurnStarts): void => {
		starts.set(deskId, { ...starts.get(deskId), ...start })
	}
	for (const event of events) {
		if (event.kind === 'desk-opened' || event.kind === 'desk-reloaded')
			mark(event.deskId, { landed: event.at })
		if (event.kind === 'round-sent' || event.kind === 'question-asked')
			mark(event.deskId, { sent: event.at })
		if (event.kind === 'round-picked')
			mark(event.deskId, { picked: event.at })
		if (event.kind === 'agent-replied')
			mark(event.deskId, { replied: event.at })
	}
	return starts
}

import {
	DAY_MS,
	median,
	reviewTimes,
	roundsPerDay,
	roundsSince,
	verdictTotals,
	WEEK_DAYS,
} from '@entities/hub/journal-stats'
import { turnCounts } from '@entities/hub/turn'

import { MINUTES_PER_HOUR, MS_PER_SECOND, SECONDS_PER_MINUTE } from '../format'

import type { JournalEvent } from '@entities/hub/journal'
import type { VerdictTotals } from '@entities/hub/journal-stats'
import type { HubDesk } from '@entities/hub/model'

// The cockpit's figures, each counted from the listing or the journal. A figure the journal
// does not reach back far enough to count is null (the tile says so in words).
export type CockpitStats = {
	yours: number
	agent: number
	roundsThisWeek: number
	// Null until the journal reaches back two weeks.
	roundsWeekBefore: number | null
	// The reviewer's median time from a diff landing to the Send, over this week's Sends (ms).
	medianReview: number | null
	perDay: number[]
	verdicts: VerdictTotals
}

// Fourteen days of rounds: this week and the one before, side by side.
const WEEKS_CHARTED = 2
export const CHART_DAYS = WEEKS_CHARTED * WEEK_DAYS

export function cockpitStats(
	desks: readonly HubDesk[],
	events: readonly JournalEvent[],
	now: number,
): CockpitStats {
	const counts = turnCounts(desks)
	const weekAgo = now - WEEK_DAYS * DAY_MS
	const twoWeeksAgo = now - CHART_DAYS * DAY_MS
	const thisWeek = roundsSince(events, weekAgo)
	const [first] = events
	const reachesTwoWeeks = !!first && Date.parse(first.at) <= twoWeeksAgo
	return {
		yours: counts.yours,
		agent: counts.agent,
		roundsThisWeek: thisWeek.length,
		roundsWeekBefore: reachesTwoWeeks
			? roundsSince(events, twoWeeksAgo).length - thisWeek.length
			: null,
		medianReview: median(reviewTimes(events, weekAgo)),
		perDay: roundsPerDay(events, now, CHART_DAYS),
		verdicts: verdictTotals(thisWeek),
	}
}

// A duration as a figure and its unit, at the coarsest unit that keeps it whole: "45 s",
// "6 min", "2 h".
export function durationFigure(ms: number): { figure: number; unit: string } {
	const seconds = Math.round(ms / MS_PER_SECOND)
	if (seconds < SECONDS_PER_MINUTE) return { figure: seconds, unit: 's' }
	const minutes = Math.round(seconds / SECONDS_PER_MINUTE)
	if (minutes < MINUTES_PER_HOUR) return { figure: minutes, unit: 'min' }
	return { figure: Math.round(minutes / MINUTES_PER_HOUR), unit: 'h' }
}

// A median review time as a tile's figure; none until a round has been timed.
export function reviewFigure(
	ms: number | null,
): { figure: number; unit: string } | null {
	if (ms === null) return null
	return durationFigure(ms)
}

// The week against the one before, in words: "+4 on the week before", "level with…".
export function weekDelta(thisWeek: number, before: number | null): string {
	if (before === null) return 'Counted from the hub journal'
	const delta = thisWeek - before
	if (!delta) return 'Level with the week before'
	return `${delta > 0 ? '+' : ''}${delta} on the week before`
}

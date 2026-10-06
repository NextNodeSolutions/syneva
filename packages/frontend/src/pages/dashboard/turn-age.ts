import { turnOf } from '@entities/hub/turn'

import { relativeTime } from './format'

import type { HubDesk } from '@entities/hub/model'

const AGO = / ago$/

// How long the desk's current turn has lasted, in the turn's own words: an agent has been
// waiting on the reviewer, at work, or the review has been out for a while. Every display (the
// ledger's rows, the board's cards) says it the same way, from the same start (turnSince).
// How long, in a word, beside a label that already names the turn ("Your turn · 19m").
export function turnLasted(since: string, now: number): string {
	return relativeTime(since, now).replace(AGO, '')
}

export function turnAge(desk: HubDesk, since: string, now: number): string {
	const lasted = turnLasted(since, now)
	const turn = turnOf(desk)
	if (turn === 'yours') return `waiting ${lasted}`
	if (turn === 'agent') return `working ${lasted}`
	if (turn === 'sent') return `sent ${relativeTime(since, now)}`
	return `quiet ${lasted}`
}

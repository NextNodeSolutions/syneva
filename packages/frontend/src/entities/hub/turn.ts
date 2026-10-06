import { deskStage } from './stage'

import type { TurnStarts } from './journal-stats'
import type { HubDesk } from './model'

// Whose move it is on a desk: the dashboard's first question, folded from the desk's stage
// (stage.ts), which keeps the finer distinctions for the row's own words.
// - yours: an agent is parked on the desk, blocked until the reviewer sends.
// - agent: the agent is at work (it posted what it is doing and is not waiting).
// - sent: a review or questions went out and no agent has picked them up yet.
// - idle: nothing moves until someone acts - no agent attached, or no changes yet.
export type Turn = 'yours' | 'agent' | 'sent' | 'idle'

// In the order the round runs, the reviewer's own turn first: the order of the circuit's
// stations, the board's columns and every grouped listing.
export const TURNS: readonly Turn[] = ['yours', 'agent', 'sent', 'idle']

export function turnOf(desk: HubDesk): Turn {
	const { kind } = deskStage(desk)
	if (kind === 'yours') return 'yours'
	if (kind === 'working') return 'agent'
	if (kind === 'sent' || kind === 'asked') return 'sent'
	return 'idle'
}

export type TurnCounts = Record<Turn, number>

export function turnCounts(desks: readonly HubDesk[]): TurnCounts {
	const counts: TurnCounts = { yours: 0, agent: 0, sent: 0, idle: 0 }
	for (const desk of desks) counts[turnOf(desk)] += 1
	return counts
}

// The desks of one turn, longest waiting first: on the reviewer's turn the agent that has been
// blocked longest comes first, elsewhere the least recently active.
export function desksOfTurn(desks: readonly HubDesk[], turn: Turn): HubDesk[] {
	return desks
		.filter(desk => turnOf(desk) === turn)
		.toSorted((a, b) => a.lastActivityAt.localeCompare(b.lastActivityAt))
}

// The later of two ISO times, either of which may be missing.
function latest(
	a: string | undefined,
	b: string | undefined,
): string | undefined {
	if (!a || !b) return a ?? b
	return a > b ? a : b
}

// When the desk's current turn began, read the same way on every display: the reviewer's turn
// from the latest of its diff's landing, the agent's last reply and the reviewer's last Send or
// question (the turn came back after that, at the earliest), the agent's from its pickup (else its live line), what was sent
// from the Send or the question. The journal is the record; a desk it never saw falls back on
// what the listing itself says.
export function turnSince(
	desk: HubDesk,
	starts: TurnStarts | undefined,
): string {
	const turn = turnOf(desk)
	if (turn === 'yours')
		return (
			latest(latest(starts?.landed, starts?.replied), starts?.sent) ??
			desk.openedAt
		)
	if (turn === 'agent')
		return starts?.picked ?? desk.agentActivity?.at ?? desk.lastActivityAt
	if (turn === 'sent') return starts?.sent ?? desk.lastActivityAt
	return desk.lastActivityAt
}

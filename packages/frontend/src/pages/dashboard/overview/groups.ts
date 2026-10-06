import { groupByProject } from '@entities/hub/model'
import { TURNS, turnOf } from '@entities/hub/turn'

import { displayRoot } from '../format'

import { TURN_COPY } from './turn-copy'

import type { HubDesk } from '@entities/hub/model'
import type { Turn } from '@entities/hub/turn'
import type { LedgerGroup } from '../react/desk-ledger'

// How the overview's ledger groups its desks: by turn (the default: the reviewer's own first)
// or by repository. Within a turn, desks keep a stable order the polls never reshuffle: the
// one that has waited longest first (when its diff landed, from the journal, else when it
// opened).
export type Grouping = 'turn' | 'project'

export type WaitingSince = (desk: HubDesk) => string

export function groupsByTurn(
	desks: readonly HubDesk[],
	{ station, since }: { station: Turn | null; since: WaitingSince },
): LedgerGroup[] {
	const turns = station ? [station] : TURNS
	return turns.flatMap(turn => {
		const copy = TURN_COPY[turn]
		const listed = desks
			.filter(desk => turnOf(desk) === turn)
			.toSorted((a, b) => since(a).localeCompare(since(b)))
		if (!listed.length) return []
		return [
			{
				key: turn,
				title: copy.heading,
				note: copy.note,
				dot: { tone: copy.dot.tone, isHollow: copy.dot.isHollow },
				desks: listed,
			},
		]
	})
}

function turnIndex(desk: HubDesk): number {
	return TURNS.indexOf(turnOf(desk))
}

export function groupsByProject(
	desks: readonly HubDesk[],
	since: WaitingSince,
): LedgerGroup[] {
	return groupByProject(desks).map(project => ({
		key: project.id,
		title: project.name,
		meta: displayRoot(project.root),
		desks: project.desks.toSorted(
			(a, b) =>
				turnIndex(a) - turnIndex(b) || since(a).localeCompare(since(b)),
		),
	}))
}

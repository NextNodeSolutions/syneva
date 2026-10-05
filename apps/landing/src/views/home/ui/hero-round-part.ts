import { stagePart } from './hero-stage-part'

import type { Verdict } from './hero-round'

// What the hero stage's markup tells its timeline about the round: which
// file you rejected, the turn in which each verdict lands, and where each
// code bar sits on its card. The markup spreads these parts and the timeline
// reads them back through the readers below, from the same attribute names.
const ATTRIBUTE = {
	verdict: 'data-verdict',
	turn: 'data-turn',
	card: 'data-card',
	row: 'data-row',
} as const

const REJECTED: Verdict = 'no'

type RoundPart = Readonly<Record<`data-${string}`, string>>

// A file card in the agent's column, carrying your verdict on that file.
export const cardPart = (verdict: Verdict): RoundPart => ({
	...stagePart('card'),
	[ATTRIBUTE.verdict]: verdict,
})

// A code bar, at its row of its card.
export const barPart = (card: number, row: number): RoundPart => ({
	...stagePart('bar'),
	[ATTRIBUTE.card]: String(card),
	[ATTRIBUTE.row]: String(row),
})

// A verdict on the ledger, and the turn in which it lands.
export const verdictPart = (verdict: Verdict, turn: number): RoundPart => ({
	...stagePart('verdict'),
	[ATTRIBUTE.verdict]: verdict,
	[ATTRIBUTE.turn]: String(turn),
})

// The rejected file's verdict on the ledger, or a piece of its card.
export const isRejected = (element: Element): boolean =>
	element.closest(`[${ATTRIBUTE.verdict}="${REJECTED}"]`) !== null

function numberOf(element: Element, attribute: string): number {
	const marked = element.getAttribute(attribute)
	if (marked === null)
		throw new Error(
			`A hero stage ${element.tagName} lacks ${attribute}: mark it with its part in hero-round-part.ts.`,
		)
	return Number(marked)
}

export const turnOfVerdict = (verdict: Element): number =>
	numberOf(verdict, ATTRIBUTE.turn)

export const placeOfBar = (bar: Element): { card: number; row: number } => ({
	card: numberOf(bar, ATTRIBUTE.card),
	row: numberOf(bar, ATTRIBUTE.row),
})

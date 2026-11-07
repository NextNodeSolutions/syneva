import { stagePart } from './hero-stage-part'

import type { Verdict } from './hero-round'

// The markup tells the timeline which file you rejected and in which turn each verdict lands; the readers below read the same attribute names.
const ATTRIBUTE = {
	verdict: 'data-verdict',
	turn: 'data-turn',
	card: 'data-card',
	row: 'data-row',
} as const

const REJECTED: Verdict = 'no'

type RoundPart = Readonly<Record<`data-${string}`, string>>

export const cardPart = (verdict: Verdict): RoundPart => ({
	...stagePart('card'),
	[ATTRIBUTE.verdict]: verdict,
})

export const barPart = (card: number, row: number): RoundPart => ({
	...stagePart('bar'),
	[ATTRIBUTE.card]: String(card),
	[ATTRIBUTE.row]: String(row),
})

export const verdictPart = (verdict: Verdict, turn: number): RoundPart => ({
	...stagePart('verdict'),
	[ATTRIBUTE.verdict]: verdict,
	[ATTRIBUTE.turn]: String(turn),
})

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

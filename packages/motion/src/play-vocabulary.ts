import { ENTRANCES, LOOPS } from './vocabulary'

// Places the drawing vocabulary (see vocabulary.ts) when a reveal group
// arrives: each element's entrance and loop start a beat after it, with the
// element's delay.
const isAnimatable = (node: Element): node is HTMLElement | SVGElement =>
	node instanceof HTMLElement || node instanceof SVGElement
const isKindOf = <Kind extends string>(
	starters: Readonly<Record<Kind, unknown>>,
	kind: string,
): kind is Kind => Object.hasOwn(starters, kind)

// A delay is inherited like the CSS custom property it replaces: a loop
// nested in a staggered group (a pulse inside a rising card) keeps time with
// that group, so the nearest data-delay, its own or an ancestor's, applies.
function delayOf(element: Element): number {
	const owner = element.closest('[data-delay]')
	return owner instanceof HTMLElement || owner instanceof SVGElement
		? Number(owner.dataset.delay)
		: 0
}

// Starts every vocabulary element that belongs to this reveal group (and not
// to a nested one). An element without a box (a drawing's secondary words on
// phones) plays unseen and simply shows its finished pose if it gets one.
export function playVocabulary(group: Element): void {
	for (const element of group.querySelectorAll('[data-anim]')) {
		if (
			!isAnimatable(element) ||
			element.closest('[data-reveal]') !== group
		)
			continue
		const kind = element.dataset.anim ?? ''
		const delay = delayOf(element)
		if (isKindOf(ENTRANCES, kind)) ENTRANCES[kind](element, delay)
		if (isKindOf(LOOPS, kind)) LOOPS[kind](element, delay)
	}
}

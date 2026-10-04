// Places the drawing vocabulary (see vocabulary.ts) when a reveal group
// arrives: each of the group's elements starts its kind with its delay.
const isAnimatable = (node: Element): node is HTMLElement | SVGElement =>
	node instanceof HTMLElement || node instanceof SVGElement
const isKindOf = <Kind extends string>(
	starters: Readonly<Record<Kind, unknown>>,
	kind: string,
): kind is Kind => Object.hasOwn(starters, kind)

type Starter<Started> = (
	element: HTMLElement | SVGElement,
	delay: number,
) => Started

// A delay is inherited: a loop nested in a staggered group (a pulse inside a
// rising card) keeps time with that group, so the nearest data-delay, its own
// or an ancestor's, applies.
function delayOf(element: Element): number {
	const owner = element.closest('[data-delay]')
	return owner instanceof HTMLElement || owner instanceof SVGElement
		? Number(owner.dataset.delay)
		: 0
}

// Starts every vocabulary element of this reveal group (not of a nested one)
// whose kind `starters` holds, and returns what each started. An element
// without a box (a drawing's secondary words on phones) plays unseen and
// simply shows its finished pose if it gets one.
export function playVocabulary<Kind extends string, Started>(
	group: Element,
	starters: Readonly<Record<Kind, Starter<Started>>>,
): Started[] {
	const started: Started[] = []
	for (const element of group.querySelectorAll('[data-anim]')) {
		if (
			!isAnimatable(element) ||
			element.closest('[data-reveal]') !== group
		)
			continue
		const kind = element.dataset.anim ?? ''
		if (isKindOf(starters, kind))
			started.push(starters[kind](element, delayOf(element)))
	}
	return started
}

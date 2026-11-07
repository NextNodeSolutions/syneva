import { ATTRIBUTE } from './attributes'

// Starts each of the group's elements when its kind is named, with its delay.
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

// data-delay is inherited: the nearest ancestor's (or own) applies.
function delayOf(element: Element): number {
	const owner = element.closest(`[${ATTRIBUTE.delay}]`)
	return owner ? Number(owner.getAttribute(ATTRIBUTE.delay)) : 0
}

// Starts only this group's own vocabulary elements (not a nested group's). An element without a box plays unseen and shows its finished pose if one arrives.
export function playVocabulary<Kind extends string, Started>(
	group: Element,
	starters: Readonly<Record<Kind, Starter<Started>>>,
): Started[] {
	const started: Started[] = []
	for (const element of group.querySelectorAll(`[${ATTRIBUTE.anim}]`)) {
		if (
			!isAnimatable(element) ||
			element.closest(`[${ATTRIBUTE.revealGroup}]`) !== group
		)
			continue
		const kind = element.getAttribute(ATTRIBUTE.anim) ?? ''
		if (isKindOf(starters, kind))
			started.push(starters[kind](element, delayOf(element)))
	}
	return started
}

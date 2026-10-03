import { sceneEntrance, syncScenes } from './scenes'
import { ENTRANCES, LOOPS } from './vocabulary'

import type { Entrance } from './scenes'

// Places the drawing vocabulary (see vocabulary.ts) when a reveal group
// arrives: each element's entrance and loop start a beat after it, with the
// element's delay.
const isAnimatable = (node: Element): node is HTMLElement | SVGElement =>
	node instanceof HTMLElement || node instanceof SVGElement

// A delay is inherited like the CSS custom property it replaces: a loop
// nested in a staggered group (a pulse inside a rising card) keeps time with
// that group, so the nearest data-delay, its own or an ancestor's, applies.
function delayOf(element: Element): number {
	const owner = element.closest('[data-delay]')
	return owner instanceof HTMLElement || owner instanceof SVGElement
		? Number(owner.dataset.delay)
		: 0
}

// A stylesheet animation only starts on a rendered element: one hidden by
// display: none (a drawing's secondary words on phones) waits, and starts
// the first time it gets a box. Once it has run, hiding and showing it again
// changes nothing, as measured on the stylesheet animations this replaces.
// A ResizeObserver reports the box arriving (an SVG element's box is in user
// units, so scaling a drawing never fires it).
type Placed = {
	element: HTMLElement | SVGElement
	kind: string
	delay: number
	entrances: Entrance[]
}
// Elements still waiting for a box.
const waiting = new Map<Element, Placed>()

// Read from the display chain: checkVisibility() misses a hidden SVG group.
function isRendered(element: Element): boolean {
	for (let node: Element | null = element; node; node = node.parentElement)
		if (getComputedStyle(node).display === 'none') return false
	return true
}

function start({ element, kind, delay, entrances }: Placed): void {
	entrances.forEach(entrance => entrance.play())
	LOOPS[kind]?.(element, delay)
}

function follow(
	records: ResizeObserverEntry[],
	observer: ResizeObserver,
): void {
	let hasStarted = false
	for (const { target } of records) {
		const entry = waiting.get(target)
		if (!entry || !isRendered(target)) continue
		waiting.delete(target)
		observer.unobserve(target)
		start(entry)
		hasStarted = true
	}
	if (hasStarted) syncScenes()
}

// Kept in module scope: the observer must outlive the calls that feed it.
const watcher =
	typeof ResizeObserver === 'function'
		? new ResizeObserver(follow)
		: undefined

// Starts every vocabulary element that belongs to this reveal group (and not
// to a nested one); a hidden one waits for its box.
export function playVocabulary(group: Element): void {
	for (const element of group.querySelectorAll('[data-anim]')) {
		if (
			!isAnimatable(element) ||
			element.closest('[data-reveal]') !== group
		)
			continue
		const kind = element.dataset.anim ?? ''
		const delay = delayOf(element)
		const runs = ENTRANCES[kind]?.(element, delay) ?? []
		const entry: Placed = {
			element,
			kind,
			delay,
			entrances: runs.map(run => sceneEntrance(element, run)),
		}
		if (isRendered(element) || !watcher) start(entry)
		else {
			waiting.set(element, entry)
			watcher.observe(element)
		}
	}
}

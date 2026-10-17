import type { GuideLayout } from './guide-pane'

// Where a domain's reading was left, kept per layout: the explanation hidden and shown again, or the page left for the project level and reopened, comes back to the same place. Between the layouts the pixel offset means nothing (the page and the column lay the same blocks out at different widths), so the place is also the block at the scroller's top and how far into it the reader was; the other layout scrolls to that block.

type Place = {
	domainId: string
	top: number
	blockId: string | null
	offset: number
	at: number
}

const lastPlace: Partial<Record<GuideLayout, Place>> = {}

const BLOCKS = '[data-block]'

function topOf(element: Element, scroller: HTMLElement): number {
	return (
		element.getBoundingClientRect().top -
		scroller.getBoundingClientRect().top +
		scroller.scrollTop
	)
}

export function rememberPlace(
	layout: GuideLayout,
	domainId: string,
	scroller: HTMLElement,
): void {
	const top = scroller.scrollTop
	const block = [...scroller.querySelectorAll<HTMLElement>(BLOCKS)].find(
		candidate => topOf(candidate, scroller) + candidate.offsetHeight > top,
	)
	lastPlace[layout] = {
		domainId,
		top,
		blockId: block?.dataset['block'] ?? null,
		offset: block ? Math.max(0, top - topOf(block, scroller)) : 0,
		at: performance.now(),
	}
}

// The scroller's top for this domain: its own layout's place when that is the latest, else the other layout's, carried over by its block; the top of the domain when neither layout read it.
export function placeTop(
	layout: GuideLayout,
	domainId: string,
	scroller: HTMLElement,
): number {
	const own = lastPlace[layout]
	const other = lastPlace[layout === 'page' ? 'column' : 'page']
	const [latest] = [own, other]
		.filter((place): place is Place => place?.domainId === domainId)
		.toSorted((a, b) => b.at - a.at)
	if (!latest) return 0
	if (latest === own) return latest.top
	if (!latest.blockId) return 0
	const block = scroller.querySelector(
		`[data-block="${CSS.escape(latest.blockId)}"]`,
	)
	if (!(block instanceof HTMLElement)) return 0
	return topOf(block, scroller) + Math.min(latest.offset, block.offsetHeight)
}

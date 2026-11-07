import type { SectionMenu } from './navigation-parts'

type TriggerMove = (index: number, count: number) => number

export const TRIGGER_MOVES: Record<string, TriggerMove> = {
	ArrowRight: (index, count) => (index + 1) % count,
	ArrowLeft: (index, count) => (index + count - 1) % count,
	Home: () => 0,
	End: (_index, count) => count - 1,
}

// One dropdown follows the whole bar in the markup, so the browser's Tab order would leave an open panel for the page and skip the bar items after its trigger.
// Tab follows the visual order instead: trigger, its panel's links, then the bar item after.
export type TabDirection = 'forward' | 'backward'

type Header = { root: HTMLElement; dropdown: HTMLElement; menu: SectionMenu }

const FOCUSABLE =
	'a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'

// What Tab can reach in a container: shown, and outside any inert subtree.
const focusablesIn = (container: Element): HTMLElement[] =>
	[...container.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
		element =>
			element.getClientRects().length > 0 && !element.closest('[inert]'),
	)

function afterTrigger({
	root,
	dropdown,
	menu,
}: Header): HTMLElement | undefined {
	const bar = focusablesIn(root).filter(
		element => !dropdown.contains(element),
	)
	return bar[bar.indexOf(menu.trigger) + 1]
}

export function panelTabTarget(
	header: Header,
	from: Element,
	direction: TabDirection,
): HTMLElement | undefined {
	const { menu } = header
	const links = focusablesIn(menu.panel)
	const [first] = links
	if (direction === 'forward' && from === menu.trigger) return first
	if (direction === 'backward' && from === first) return menu.trigger
	if (direction === 'forward' && from === links.at(-1))
		return afterTrigger(header)
	return undefined
}

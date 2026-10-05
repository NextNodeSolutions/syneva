import type { SectionMenu } from './navigation-parts'

// The header's keyboard order: arrow keys along the triggers, and Tab around
// the open panel.

// Where a key moves from the trigger at index, among count triggers.
type TriggerMove = (index: number, count: number) => number

// Keys that move focus along the bar's triggers, wrapping at both ends.
export const TRIGGER_MOVES: Record<string, TriggerMove> = {
	ArrowRight: (index, count) => (index + 1) % count,
	ArrowLeft: (index, count) => (index + count - 1) % count,
	Home: () => 0,
	End: (_index, count) => count - 1,
}

// Every section's panel lives in the one dropdown that follows the whole bar
// in the markup, so the browser's Tab order would leave an open panel for the
// page and skip the bar items after its trigger. Around the open panel, Tab
// follows the visual order instead: the trigger, its panel's links, then the
// bar item after the trigger.
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

// The bar item after the trigger, in the header outside the dropdown.
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

// Where Tab from `from` lands around the open panel, or undefined where the
// browser's own order is already right.
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

// The header's markup contract with its runtime (Navigation.astro): every
// element the script drives, found once. A missing part means the template
// changed under the script, so the lookup fails loud instead of leaving a
// header whose menus never open. A menu may have no preview rows.
type NonEmptyArray<Item> = readonly [Item, ...Item[]]

// A section's trigger and the panel its aria-controls names.
export type SectionMenu = { trigger: HTMLElement; panel: HTMLElement }

export type NavigationParts = {
	root: HTMLElement
	links: HTMLElement
	dropdown: HTMLElement
	toggle: HTMLElement
	// In the bar's order.
	menus: NonEmptyArray<SectionMenu>
	previewLinks: HTMLElement[]
	scenes: HTMLElement[]
}

const missing = (attribute: string): Error =>
	new Error(
		`The navigation runtime found no [${attribute}] element: Navigation.astro must render it.`,
	)

function queryPart(scope: ParentNode, attribute: string): HTMLElement {
	const part = scope.querySelector<HTMLElement>(`[${attribute}]`)
	if (!part) throw missing(attribute)
	return part
}

function queryParts(
	scope: ParentNode,
	attribute: string,
): NonEmptyArray<HTMLElement> {
	const [first, ...rest] = [
		...scope.querySelectorAll<HTMLElement>(`[${attribute}]`),
	]
	if (!first) throw missing(attribute)
	return [first, ...rest]
}

// Each trigger with the panel its aria-controls names: a trigger naming no
// panel would open nothing.
function pairMenus(
	triggers: NonEmptyArray<HTMLElement>,
	panels: readonly HTMLElement[],
): NonEmptyArray<SectionMenu> {
	const menuOf = (trigger: HTMLElement): SectionMenu => {
		const id = trigger.getAttribute('aria-controls')
		const panel = panels.find(candidate => candidate.id === id)
		if (!panel)
			throw new Error(
				`The navigation trigger #${trigger.id} controls "${id}", which names no [data-nav-panel]: Navigation.astro must render the panel with that id.`,
			)
		return { trigger, panel }
	}
	const [first, ...rest] = triggers
	return [menuOf(first), ...rest.map(menuOf)]
}

export function queryNavigationParts(scope: ParentNode): NavigationParts {
	const root = queryPart(scope, 'data-navigation')
	return {
		root,
		links: queryPart(root, 'data-nav-links'),
		dropdown: queryPart(root, 'data-nav-dropdown'),
		toggle: queryPart(root, 'data-nav-toggle'),
		menus: pairMenus(queryParts(root, 'data-nav-trigger'), [
			...root.querySelectorAll<HTMLElement>('[data-nav-panel]'),
		]),
		previewLinks: [...root.querySelectorAll<HTMLElement>('[data-preview]')],
		scenes: [...root.querySelectorAll<HTMLElement>('[data-scene]')],
	}
}

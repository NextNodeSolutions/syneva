// The header's markup contract with its runtime (Navigation.astro): every
// element the script drives, found once. A missing part means the template
// changed under the script, so the lookup fails loud instead of leaving a
// header whose menus never open. A menu may have no preview rows.
type NonEmptyArray<Item> = readonly [Item, ...Item[]]

export type NavigationParts = {
	root: HTMLElement
	links: HTMLElement
	dropdown: HTMLElement
	toggle: HTMLElement
	triggers: NonEmptyArray<HTMLElement>
	panels: NonEmptyArray<HTMLElement>
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

export function queryNavigationParts(scope: ParentNode): NavigationParts {
	const root = queryPart(scope, 'data-navigation')
	return {
		root,
		links: queryPart(root, 'data-nav-links'),
		dropdown: queryPart(root, 'data-nav-dropdown'),
		toggle: queryPart(root, 'data-nav-toggle'),
		triggers: queryParts(root, 'data-nav-trigger'),
		panels: queryParts(root, 'data-nav-panel'),
		previewLinks: [...root.querySelectorAll<HTMLElement>('[data-preview]')],
		scenes: [...root.querySelectorAll<HTMLElement>('[data-scene]')],
	}
}

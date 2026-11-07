// Every element the script drives is found once; a missing part means the template changed under the script, so the lookup fails loud instead of leaving a header whose menus never open. A menu may have no preview rows.
type NonEmptyArray<Item> = readonly [Item, ...Item[]]

export type SectionMenu = { trigger: HTMLElement; panel: HTMLElement }

export type DockParts = {
	ruler: HTMLElement
	progress: HTMLElement
	tick: HTMLElement
	dial: SVGGElement
}

export type NavigationParts = {
	root: HTMLElement
	links: HTMLElement
	dropdown: HTMLElement
	toggle: HTMLElement
	menus: NonEmptyArray<SectionMenu>
	previewLinks: HTMLElement[]
	scenes: HTMLElement[]
	dock: DockParts
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

function queryTick(scope: ParentNode): HTMLElement {
	const template = scope.querySelector('template[data-nav-tick]')
	const tick =
		template instanceof HTMLTemplateElement
			? template.content.firstElementChild
			: null
	if (!(tick instanceof HTMLElement)) throw missing('data-nav-tick')
	return tick
}

function queryDial(scope: ParentNode): SVGGElement {
	const dial = scope.querySelector('[data-brand-dial]')
	if (!(dial instanceof SVGGElement)) throw missing('data-brand-dial')
	return dial
}

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
		dock: {
			ruler: queryPart(root, 'data-nav-ruler'),
			progress: queryPart(root, 'data-nav-progress'),
			tick: queryTick(root),
			dial: queryDial(root),
		},
	}
}

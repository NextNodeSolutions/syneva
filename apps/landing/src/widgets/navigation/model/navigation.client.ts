import { compact } from './compact'
import { Navigation } from './navigation'
import { queryNavigationParts } from './navigation-parts'

import type { NavigationParts, SectionMenu } from './navigation-parts'

// The header's script: wires the DOM events to the navigation's intents and
// keeps the dropdown placed as the layout changes.
function bindTrigger(navigation: Navigation, menu: SectionMenu): void {
	const { trigger } = menu
	trigger.addEventListener('pointerenter', event =>
		navigation.scheduleOpen(menu, event),
	)
	trigger.addEventListener('click', event => navigation.activate(menu, event))
	trigger.addEventListener('keydown', event => {
		if (navigation.moveFrom(menu, event.key)) event.preventDefault()
	})
}

function bindPreview(navigation: Navigation, link: HTMLElement): void {
	link.addEventListener('pointerenter', () => navigation.selectPreview(link))
	link.addEventListener('focus', () => navigation.selectPreview(link))
}

function bindHeader(
	navigation: Navigation,
	{ root, dropdown, toggle }: NavigationParts,
): void {
	root.addEventListener('pointerenter', () => navigation.keepOpen())
	root.addEventListener('pointerleave', event =>
		navigation.scheduleClose(event),
	)
	dropdown.addEventListener('pointerenter', () =>
		navigation.holdCurrentPanel(),
	)
	root.addEventListener('keydown', () => navigation.enterKeyboardMode())
	root.addEventListener('focusout', event =>
		navigation.dismissOnFocusExit(event),
	)
	toggle.addEventListener('click', event => navigation.toggleBar(event))
	root.addEventListener('click', event => {
		if (event.target instanceof Element && event.target.closest('a'))
			navigation.dismiss()
	})
}

function bindDocument(navigation: Navigation): void {
	document.addEventListener('pointerdown', event =>
		navigation.dismissOnOutsidePress(event),
	)
	document.addEventListener('keydown', event => {
		if (event.key !== 'Escape' || !navigation.isOpen) return
		event.preventDefault()
		navigation.escape()
	})
}

// The webfonts resize the triggers when they swap in.
async function repositionAfterFonts(reposition: () => void): Promise<void> {
	await document.fonts.ready
	reposition()
}

// The dropdown follows the layout: the breakpoint, the window, the header or
// a panel changing size, and the webfonts.
function bindLayout(
	navigation: Navigation,
	{ root, menus }: NavigationParts,
): void {
	compact.addEventListener('change', () => navigation.adaptToBreakpoint())
	const reposition = (): void => navigation.positionPanel()
	window.addEventListener('resize', reposition)
	const resizeObserver = new ResizeObserver(reposition)
	resizeObserver.observe(root)
	menus.forEach(({ panel }) => resizeObserver.observe(panel))
	reposition()
	void repositionAfterFonts(reposition)
}

const parts = queryNavigationParts(document)
const navigation = new Navigation(parts)
parts.menus.forEach(menu => bindTrigger(navigation, menu))
parts.previewLinks.forEach(link => bindPreview(navigation, link))
bindHeader(navigation, parts)
bindDocument(navigation)
bindLayout(navigation, parts)

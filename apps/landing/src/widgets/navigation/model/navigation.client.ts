import { compact } from './compact'
import { HeaderDock } from './header-dock'
import { MarkDial } from './mark-dial'
import { Navigation } from './navigation'
import { queryNavigationParts } from './navigation-parts'

import type { NavigationParts, SectionMenu } from './navigation-parts'

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
	root.addEventListener('keydown', event => {
		navigation.enterKeyboardMode()
		if (event.key !== 'Tab') return
		const direction = event.shiftKey ? 'backward' : 'forward'
		if (navigation.tabAround(event.target, direction))
			event.preventDefault()
	})
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

// The webfonts resize the triggers and the page's sections when they swap in.
async function afterFonts(measure: () => void): Promise<void> {
	await document.fonts.ready
	measure()
}

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
	void afterFonts(reposition)
}

function bindScroll(dock: HeaderDock, dial: MarkDial): void {
	let lastY = window.scrollY
	let isQueued = false
	const follow = (): void => {
		isQueued = false
		const y = window.scrollY
		dock.follow(y)
		dial.turn(y - lastY)
		lastY = y
	}
	window.addEventListener(
		'scroll',
		() => {
			if (isQueued) return
			isQueued = true
			requestAnimationFrame(follow)
		},
		{ passive: true },
	)
	const measure = (): void => dock.measure()
	window.addEventListener('resize', measure)
	new ResizeObserver(measure).observe(document.body)
	dock.start(lastY)
	void afterFonts(measure)
}

const parts = queryNavigationParts(document)
const navigation = new Navigation(parts)
parts.menus.forEach(menu => bindTrigger(navigation, menu))
parts.previewLinks.forEach(link => bindPreview(navigation, link))
bindHeader(navigation, parts)
bindDocument(navigation)
bindLayout(navigation, parts)
bindScroll(
	new HeaderDock(parts.root, parts.dock),
	new MarkDial(parts.dock.dial),
)

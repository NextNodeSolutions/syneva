import { compact } from './compact'
import { Navigation } from './navigation'
import { queryNavigationParts } from './navigation-parts'

import type { NavigationParts } from './navigation-parts'

// Wires the header's listeners to its controller. Rows stagger in from their
// panel's progress (--menu-order).
const ARROWS: Record<string, (index: number, count: number) => number> = {
	ArrowRight: (index, count) => (index + 1) % count,
	ArrowLeft: (index, count) => (index + count - 1) % count,
	Home: () => 0,
	End: (_index, count) => count - 1,
}

function bindTrigger(navigation: Navigation, trigger: HTMLElement): void {
	trigger.addEventListener('pointerenter', event =>
		navigation.scheduleOpen(trigger, event),
	)
	trigger.addEventListener('click', event =>
		navigation.activate(trigger, event),
	)
	trigger.addEventListener('keydown', event => {
		if (event.key === 'ArrowDown') {
			event.preventDefault()
			navigation.focusPanel(trigger)
			return
		}
		const move = ARROWS[event.key]
		if (!move) return
		event.preventDefault()
		const { triggers } = navigation
		const next = triggers[move(triggers.indexOf(trigger), triggers.length)]
		next?.focus()
		if (next) navigation.showPanel(next, 'keyboard')
	})
}

function bindPreview(navigation: Navigation, link: HTMLElement): void {
	link.addEventListener('pointerenter', () => navigation.selectPreview(link))
	link.addEventListener('focus', () => navigation.selectPreview(link))
}

function bindDocument(navigation: Navigation): void {
	document.addEventListener('pointerdown', event => {
		if (
			!(
				event.target instanceof Node &&
				navigation.root.contains(event.target)
			)
		)
			navigation.dismiss()
	})
	document.addEventListener('keydown', event => {
		if (event.key !== 'Escape' || !navigation.isOpen) return
		event.preventDefault()
		navigation.escape()
	})
}

async function bindNavigation(parts: NavigationParts): Promise<void> {
	const { root, dropdown, toggle, panels } = parts
	const navigation = new Navigation(parts)
	parts.triggers.forEach(trigger => bindTrigger(navigation, trigger))
	root.addEventListener('pointerenter', () => navigation.keepOpen())
	root.addEventListener('pointerleave', event =>
		navigation.scheduleClose(event),
	)
	dropdown.addEventListener('pointerenter', () => navigation.cancelTimers())
	root.addEventListener('keydown', () => navigation.enterKeyboardMode())
	root.addEventListener('focusout', event =>
		navigation.dismissOnFocusExit(event),
	)
	toggle.addEventListener('click', event => navigation.toggleBar(event))
	root.addEventListener('click', event => {
		if (event.target instanceof Element && event.target.closest('a'))
			navigation.dismiss()
	})
	bindDocument(navigation)
	parts.previewLinks.forEach(link => bindPreview(navigation, link))
	panels.forEach(panel => {
		panel
			.querySelectorAll<HTMLElement>('[data-menu-row]')
			.forEach((row, index) => {
				row.style.setProperty('--menu-order', String(index))
			})
	})
	compact.addEventListener('change', () => navigation.adaptToBreakpoint())
	const reposition = (): void => navigation.positionPanel()
	window.addEventListener('resize', reposition)
	const resizeObserver = new ResizeObserver(reposition)
	resizeObserver.observe(root)
	panels.forEach(panel => resizeObserver.observe(panel))
	reposition()
	await document.fonts.ready
	reposition()
}

await bindNavigation(queryNavigationParts(document))

import { compact, Navigation } from './navigation.client'

// Wires the header's listeners to its controller. Rows stagger in from their
// panel's progress (--menu-order), and the product menu starts on its first
// preview scene.
const ARROWS: Record<string, (index: number, count: number) => number> = {
	ArrowRight: (index, count) => (index + 1) % count,
	ArrowLeft: (index, count) => (index + count - 1) % count,
	Home: () => 0,
	End: (_index, count) => count - 1,
}

function bindTrigger(navigation: Navigation, trigger: HTMLElement): void {
	trigger.addEventListener('pointerenter', event =>
		navigation.hover(trigger, event),
	)
	trigger.addEventListener('click', event => navigation.click(trigger, event))
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

function bindPreviews(navigation: Navigation): void {
	const links = [
		...navigation.root.querySelectorAll<HTMLElement>('[data-preview]'),
	]
	const scenes = [
		...navigation.root.querySelectorAll<HTMLElement>('[data-scene]'),
	]
	const show = (link: HTMLElement): void => {
		navigation.positionPreview(link)
		links.forEach(candidate =>
			candidate.classList.toggle('is-previewed', candidate === link),
		)
		scenes.forEach(scene =>
			scene.classList.toggle(
				'is-current',
				scene.dataset.scene === link.dataset.preview,
			),
		)
	}
	links.forEach(link => {
		link.addEventListener('pointerenter', () => show(link))
		link.addEventListener('focus', () => show(link))
	})
	const [first] = links
	if (first) show(first)
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

async function bindNavigation(root: HTMLElement): Promise<void> {
	const links = root.querySelector<HTMLElement>('[data-nav-links]')
	const dropdown = root.querySelector<HTMLElement>('[data-nav-dropdown]')
	const toggle = root.querySelector<HTMLElement>('[data-nav-toggle]')
	if (!links || !dropdown || !toggle) return
	const navigation = new Navigation(root, { links, dropdown, toggle })
	navigation.triggers.forEach(trigger => bindTrigger(navigation, trigger))
	root.addEventListener('pointerenter', () => navigation.keepOpen())
	root.addEventListener('pointerleave', event => navigation.leave(event))
	dropdown.addEventListener('pointerenter', () => navigation.cancelTimers())
	root.addEventListener('keydown', () => navigation.keyboard())
	root.addEventListener('focusout', event => navigation.focusLeft(event))
	toggle.addEventListener('click', event => navigation.toggleBar(event))
	root.addEventListener('click', event => {
		if (event.target instanceof Element && event.target.closest('a'))
			navigation.dismiss()
	})
	bindDocument(navigation)
	bindPreviews(navigation)
	root.querySelectorAll('[data-nav-panel]').forEach(panel => {
		panel
			.querySelectorAll<HTMLElement>('[data-menu-row]')
			.forEach((row, index) => {
				row.style.setProperty('--menu-order', String(index))
			})
	})
	compact.addEventListener('change', () => navigation.breakpointChanged())
	const reposition = (): void => navigation.positionPanel()
	window.addEventListener('resize', reposition)
	const resizeObserver = new ResizeObserver(reposition)
	resizeObserver.observe(root)
	root.querySelectorAll('[data-nav-panel]').forEach(panel =>
		resizeObserver.observe(panel),
	)
	reposition()
	await document.fonts.ready
	reposition()
}

const root = document.querySelector<HTMLElement>('[data-navigation]')
if (root) await bindNavigation(root)

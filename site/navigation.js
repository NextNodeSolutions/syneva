import { NavigationMorph } from './navigation-morph.js'

const navigation = document.querySelector('.navigation')
const links = navigation.querySelector('.nav-links')
const triggers = [...navigation.querySelectorAll('.nav-trigger')]
const panels = [...navigation.querySelectorAll('.nav-panel')]
const dropdown = navigation.querySelector('.nav-dropdown')
const toggle = navigation.querySelector('.nav-toggle')
const compact = window.matchMedia('(max-width: 700px)')
const hoverPointer = window.matchMedia('(hover: hover) and (pointer: fine)')
const scenes = [...navigation.querySelectorAll('.preview-scene')]
const morph = new NavigationMorph(navigation, panels, scenes, compact)
const openDelayMs = 60
const closeDelayMs = 180
let currentTrigger
let clickedTrigger
let currentPanel
let openTimer
let closeTimer

function cancelTimers() {
	clearTimeout(openTimer)
	clearTimeout(closeTimer)
}

function positionPanel() {
	morph.position(currentTrigger, currentPanel)
	const selected = navigation.querySelector('.is-previewed')
	if (selected) positionPreview(selected)
}

function closePanel() {
	cancelTimers()
	if (dropdown.contains(document.activeElement)) currentTrigger?.focus()
	currentTrigger?.setAttribute('aria-expanded', 'false')
	currentPanel?.classList.remove('is-active')
	currentPanel?.setAttribute('aria-hidden', 'true')
	if (currentPanel) currentPanel.inert = true
	morph.close()
	dropdown.dataset.open = 'false'
	currentPanel = undefined
	currentTrigger = undefined
	clickedTrigger = undefined
}

function dismissNavigation() {
	const focused = document.activeElement
	const shouldRestore =
		compact.matches &&
		[links, dropdown].some(container => container.contains(focused))
	closePanel()
	navigation.dataset.mobileOpen = 'false'
	toggle.setAttribute('aria-expanded', 'false')
	toggle.setAttribute('aria-label', 'Open navigation')
	if (shouldRestore) toggle.focus()
}

function showPanel(trigger, input = 'pointer') {
	cancelTimers()
	navigation.dataset.input = input
	if (trigger === currentTrigger) return
	clickedTrigger = undefined
	if (dropdown.contains(document.activeElement)) trigger.focus()
	currentTrigger?.setAttribute('aria-expanded', 'false')
	currentPanel?.classList.remove('is-active')
	currentPanel?.setAttribute('aria-hidden', 'true')
	if (currentPanel) currentPanel.inert = true
	currentTrigger = trigger
	currentPanel = document.getElementById(
		trigger.getAttribute('aria-controls'),
	)
	positionPanel()
	currentPanel.classList.add('is-active')
	currentPanel.setAttribute('aria-hidden', 'false')
	currentPanel.inert = false
	trigger.setAttribute('aria-expanded', 'true')
	dropdown.dataset.open = 'true'
}

function focusPanel(trigger) {
	showPanel(trigger, 'keyboard')
	currentPanel.querySelector('a').focus()
}

function handleTriggerKey(event) {
	const trigger = event.currentTarget
	const index = triggers.indexOf(trigger)
	const destinations = {
		ArrowRight: (index + 1) % triggers.length,
		ArrowLeft: (index + triggers.length - 1) % triggers.length,
		Home: 0,
		End: triggers.length - 1,
	}
	if (event.key === 'ArrowDown') {
		event.preventDefault()
		focusPanel(trigger)
		return
	}
	if (!(event.key in destinations)) return
	event.preventDefault()
	const next = triggers[destinations[event.key]]
	next.focus()
	showPanel(next, 'keyboard')
}

function bindTrigger(trigger) {
	trigger.addEventListener('pointerenter', () => {
		if (compact.matches || !hoverPointer.matches) return
		cancelTimers()
		openTimer = setTimeout(
			() => showPanel(trigger),
			currentPanel ? 0 : openDelayMs,
		)
	})
	trigger.addEventListener('click', event => {
		if (event.detail === 0) {
			focusPanel(trigger)
			return
		}
		if (currentTrigger === trigger && clickedTrigger === trigger) {
			closePanel()
			return
		}
		// Hover may already have opened it before the first deliberate click.
		showPanel(trigger)
		clickedTrigger = trigger
	})
	trigger.addEventListener('keydown', handleTriggerKey)
}
triggers.forEach(bindTrigger)

navigation.addEventListener('pointerenter', () => clearTimeout(closeTimer))
navigation.addEventListener('pointerleave', () => {
	if (compact.matches || navigation.dataset.input === 'keyboard') return
	clearTimeout(openTimer)
	closeTimer = setTimeout(closePanel, closeDelayMs)
})
dropdown.addEventListener('pointerenter', cancelTimers)
navigation.addEventListener('keydown', () => {
	navigation.dataset.input = 'keyboard'
	morph.finish()
})
navigation.addEventListener('focusout', event => {
	if (navigation.contains(event.relatedTarget)) return
	// A breakpoint can hide focus before its change event fires.
	const hasHiddenFocus =
		!event.relatedTarget && !event.target.checkVisibility()
	dismissNavigation()
	const returnTarget = compact.matches ? toggle : triggers[0]
	if (hasHiddenFocus) returnTarget.focus()
})

toggle.addEventListener('click', event => {
	if (toggle.getAttribute('aria-expanded') === 'true') {
		dismissNavigation()
		return
	}
	navigation.dataset.mobileOpen = 'true'
	toggle.setAttribute('aria-expanded', 'true')
	toggle.setAttribute('aria-label', 'Close navigation')
	showPanel(triggers[0], event.detail === 0 ? 'keyboard' : 'pointer')
	if (event.detail === 0) triggers[0].focus()
})

document.addEventListener('pointerdown', event => {
	if (!navigation.contains(event.target)) dismissNavigation()
})
document.addEventListener('keydown', event => {
	if (
		event.key !== 'Escape' ||
		(!currentPanel && navigation.dataset.mobileOpen !== 'true')
	)
		return
	event.preventDefault()
	const returnTarget = compact.matches ? toggle : currentTrigger
	dismissNavigation()
	returnTarget?.focus()
})
navigation.addEventListener('click', event => {
	if (event.target.closest('a')) dismissNavigation()
})

const previewLinks = [...navigation.querySelectorAll('[data-preview]')]
function positionPreview(link) {
	morph.preview(scenes.find(scene => scene.dataset.scene === link.dataset.preview), link)
}
function showPreview(link) {
	positionPreview(link)
	previewLinks.forEach(item => item.classList.toggle('is-previewed', item === link))
	scenes.forEach(scene => scene.classList.toggle('is-current', scene.dataset.scene === link.dataset.preview))
}
previewLinks.forEach(link => {
	link.addEventListener('pointerenter', () => showPreview(link))
	link.addEventListener('focus', () => showPreview(link))
})
panels.forEach(panel => {
	panel.querySelectorAll('.menu-link, .workflow-link').forEach((link, index) => {
		link.style.setProperty('--menu-order', index)
	})
})
if (previewLinks.length) showPreview(previewLinks[0])

compact.addEventListener('change', () => {
	const hasNavigationFocus = navigation.contains(document.activeElement)
	const returnTarget = compact.matches
		? toggle
		: (currentTrigger ?? triggers[0])
	dismissNavigation()
	positionPanel()
	if (hasNavigationFocus) returnTarget.focus()
})
window.addEventListener('resize', positionPanel)
const resizeObserver = new ResizeObserver(positionPanel)
resizeObserver.observe(navigation)
panels.forEach(panel => resizeObserver.observe(panel))
positionPanel()
await document.fonts.ready
positionPanel()

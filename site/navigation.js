const navigation = document.querySelector('.navigation')
const links = navigation.querySelector('.nav-links')
const triggers = [...navigation.querySelectorAll('.nav-trigger')]
const panels = [...navigation.querySelectorAll('.nav-panel')]
const dropdown = navigation.querySelector('.nav-dropdown')
const toggle = navigation.querySelector('.nav-toggle')
const compact = window.matchMedia('(max-width: 700px)')
const hoverPointer = window.matchMedia('(hover: hover) and (pointer: fine)')
const openDelayMs = 60
const closeDelayMs = 180
const panelTravel = 12
const panelBorder = 2
const panelGap = 10
const mobileInset = 12
const desktopInset = 24
let currentTrigger
let currentPanel
let openTimer
let closeTimer

function cancelTimers() {
	clearTimeout(openTimer)
	clearTimeout(closeTimer)
}

function positionPanel() {
	const inset = compact.matches ? mobileInset : desktopInset
	const available = navigation.clientWidth - inset - inset - panelBorder
	navigation.style.setProperty('--nav-available', `${available}px`)
	if (!currentPanel) return
	const headerRect = navigation.getBoundingClientRect()
	const triggerRect = currentTrigger.getBoundingClientRect()
	const panelRect = currentPanel.getBoundingClientRect()
	const width = Math.ceil(panelRect.width) + panelBorder
	const left = compact.matches ? inset : triggerRect.left - headerRect.left
	const x = Math.max(
		inset,
		Math.min(left, navigation.clientWidth - width - inset),
	)
	const y =
		(compact.matches ? links : currentTrigger).getBoundingClientRect()
			.bottom -
		headerRect.top +
		panelGap
	dropdown.style.setProperty('--dropdown-x', `${x}px`)
	dropdown.style.setProperty('--dropdown-y', `${y}px`)
	const availableHeight = window.innerHeight - headerRect.top - y - inset
	dropdown.style.setProperty('--dropdown-max-height', `${availableHeight}px`)
	dropdown.style.setProperty(
		'--panel-max-height',
		`${availableHeight - panelBorder}px`,
	)
	const height = Math.ceil(
		Math.max(panelRect.height, currentPanel.scrollHeight),
	)
	dropdown.style.width = `${width}px`
	dropdown.style.height = `${height + panelBorder}px`
	links.style.setProperty('--indicator-x', `${currentTrigger.offsetLeft}px`)
	links.style.setProperty(
		'--indicator-width',
		`${currentTrigger.offsetWidth}px`,
	)
}

function closePanel() {
	cancelTimers()
	if (dropdown.contains(document.activeElement)) currentTrigger?.focus()
	currentTrigger?.setAttribute('aria-expanded', 'false')
	currentPanel?.classList.remove('is-active')
	currentPanel?.setAttribute('aria-hidden', 'true')
	if (currentPanel) currentPanel.inert = true
	dropdown.dataset.open = 'false'
	currentPanel = undefined
	currentTrigger = undefined
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
	if (dropdown.contains(document.activeElement)) trigger.focus()
	const direction =
		triggers.indexOf(trigger) < triggers.indexOf(currentTrigger) ? -1 : 1
	const isHidden = getComputedStyle(dropdown).visibility === 'hidden'
	if (isHidden) navigation.dataset.instant = ''
	currentPanel?.style.setProperty(
		'--panel-shift',
		`${-direction * panelTravel}px`,
	)
	currentTrigger?.setAttribute('aria-expanded', 'false')
	currentPanel?.classList.remove('is-active')
	currentPanel?.setAttribute('aria-hidden', 'true')
	if (currentPanel) currentPanel.inert = true
	currentTrigger = trigger
	currentPanel = document.getElementById(
		trigger.getAttribute('aria-controls'),
	)
	currentPanel.style.setProperty(
		'--panel-shift',
		`${direction * panelTravel}px`,
	)
	positionPanel()
	// Commit geometry before revealing; text is never scaled to fit the shell.
	if (isHidden) dropdown.getBoundingClientRect()
	delete navigation.dataset.instant
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
		if (currentTrigger === trigger) closePanel()
		else showPanel(trigger)
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

function showPreview(link) {
	const name = link.dataset.preview
	navigation.querySelectorAll('.preview-scene').forEach(scene => {
		scene.classList.toggle('is-current', scene.dataset.scene === name)
	})
}
navigation.querySelectorAll('[data-preview]').forEach(link => {
	link.addEventListener('pointerenter', () => showPreview(link))
	link.addEventListener('focus', () => showPreview(link))
})

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

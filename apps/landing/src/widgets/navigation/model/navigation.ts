import { compact } from './compact'
import { NavigationMorph } from './navigation-morph'

// The header's behavior: hover and click open a section's panel in the
// morphing dropdown, arrow keys move between triggers, Escape and outside
// clicks dismiss, and on phones a toggle opens the link bar first.
const OPEN_DELAY_MS = 60
const CLOSE_DELAY_MS = 180

// Hover intent follows a mouse only: a touch or pen lift fires pointerleave
// too, which would close the panel the tap just opened.
const isMouse = (event: PointerEvent): boolean => event.pointerType === 'mouse'
// A click without a press count came from the keyboard (Enter or Space).
const isKeyboardActivation = (event: MouseEvent): boolean => event.detail === 0

type InputMode = 'pointer' | 'keyboard'

export class Navigation {
	readonly #root: HTMLElement
	readonly #links: HTMLElement
	readonly #triggers: HTMLElement[]
	readonly #dropdown: HTMLElement
	readonly #toggle: HTMLElement
	readonly #scenes: HTMLElement[]
	readonly #morph: NavigationMorph
	#currentTrigger: HTMLElement | undefined
	#clickedTrigger: HTMLElement | undefined
	#currentPanel: HTMLElement | undefined
	#openTimer: ReturnType<typeof setTimeout> | undefined
	#closeTimer: ReturnType<typeof setTimeout> | undefined

	constructor(
		root: HTMLElement,
		parts: {
			links: HTMLElement
			dropdown: HTMLElement
			toggle: HTMLElement
		},
	) {
		this.#root = root
		this.#links = parts.links
		this.#dropdown = parts.dropdown
		this.#toggle = parts.toggle
		this.#triggers = [
			...root.querySelectorAll<HTMLElement>('[data-nav-trigger]'),
		]
		this.#scenes = [...root.querySelectorAll<HTMLElement>('[data-scene]')]
		const panels = [
			...root.querySelectorAll<HTMLElement>('[data-nav-panel]'),
		]
		this.#morph = new NavigationMorph(root, panels, this.#scenes, compact)
	}

	get root(): HTMLElement {
		return this.#root
	}

	get triggers(): HTMLElement[] {
		return this.#triggers
	}

	get isOpen(): boolean {
		return (
			Boolean(this.#currentPanel) ||
			this.#root.dataset.mobileOpen === 'true'
		)
	}

	keepOpen(): void {
		clearTimeout(this.#closeTimer)
	}

	cancelTimers(): void {
		clearTimeout(this.#openTimer)
		clearTimeout(this.#closeTimer)
	}

	positionPanel(): void {
		this.#morph.position(this.#currentTrigger, this.#currentPanel)
		const selected = this.#root.querySelector<HTMLElement>('.is-previewed')
		if (selected) this.positionPreview(selected)
	}

	#hidePanel(): void {
		this.#currentTrigger?.setAttribute('aria-expanded', 'false')
		this.#currentPanel?.classList.remove('is-active')
		this.#currentPanel?.setAttribute('aria-hidden', 'true')
		if (this.#currentPanel) this.#currentPanel.inert = true
	}

	#closePanel(): void {
		this.cancelTimers()
		if (this.#dropdown.contains(document.activeElement))
			this.#currentTrigger?.focus()
		this.#hidePanel()
		this.#morph.close()
		this.#dropdown.dataset.open = 'false'
		this.#currentPanel = undefined
		this.#currentTrigger = undefined
		this.#clickedTrigger = undefined
	}

	dismiss(): void {
		const focused = document.activeElement
		const shouldRestore =
			compact.matches &&
			[this.#links, this.#dropdown].some(container =>
				container.contains(focused),
			)
		this.#closePanel()
		this.#root.dataset.mobileOpen = 'false'
		this.#toggle.setAttribute('aria-expanded', 'false')
		this.#toggle.setAttribute('aria-label', 'Open navigation')
		if (shouldRestore) this.#toggle.focus()
	}

	showPanel(trigger: HTMLElement, mode: InputMode = 'pointer'): void {
		this.cancelTimers()
		this.#root.dataset.input = mode
		if (trigger === this.#currentTrigger) return
		this.#clickedTrigger = undefined
		if (this.#dropdown.contains(document.activeElement)) trigger.focus()
		this.#hidePanel()
		const panel =
			document.getElementById(
				trigger.getAttribute('aria-controls') ?? '',
			) ?? undefined
		this.#currentTrigger = trigger
		this.#currentPanel = panel
		this.positionPanel()
		panel?.classList.add('is-active')
		panel?.setAttribute('aria-hidden', 'false')
		if (panel) panel.inert = false
		trigger.setAttribute('aria-expanded', 'true')
		this.#dropdown.dataset.open = 'true'
	}

	focusPanel(trigger: HTMLElement): void {
		this.showPanel(trigger, 'keyboard')
		this.#currentPanel?.querySelector('a')?.focus()
	}

	scheduleOpen(trigger: HTMLElement, event: PointerEvent): void {
		if (compact.matches || !isMouse(event)) return
		this.cancelTimers()
		this.#openTimer = setTimeout(
			() => this.showPanel(trigger),
			this.#currentPanel ? 0 : OPEN_DELAY_MS,
		)
	}

	activate(trigger: HTMLElement, event: MouseEvent): void {
		if (isKeyboardActivation(event)) {
			this.focusPanel(trigger)
			return
		}
		if (
			this.#currentTrigger === trigger &&
			this.#clickedTrigger === trigger
		) {
			this.#closePanel()
			return
		}
		// Hover may already have opened it before the first deliberate click.
		this.showPanel(trigger)
		this.#clickedTrigger = trigger
	}

	scheduleClose(event: PointerEvent): void {
		if (
			compact.matches ||
			!isMouse(event) ||
			this.#root.dataset.input === 'keyboard'
		)
			return
		clearTimeout(this.#openTimer)
		this.#closeTimer = setTimeout(() => this.#closePanel(), CLOSE_DELAY_MS)
	}

	enterKeyboardMode(): void {
		this.#root.dataset.input = 'keyboard'
		this.#morph.finish()
	}

	toggleBar(event: MouseEvent): void {
		if (this.#toggle.getAttribute('aria-expanded') === 'true') {
			this.dismiss()
			return
		}
		const [first] = this.#triggers
		if (!first) return
		this.#root.dataset.mobileOpen = 'true'
		this.#toggle.setAttribute('aria-expanded', 'true')
		this.#toggle.setAttribute('aria-label', 'Close navigation')
		const isKeyboard = isKeyboardActivation(event)
		this.showPanel(first, isKeyboard ? 'keyboard' : 'pointer')
		if (isKeyboard) first.focus()
	}

	// Focus goes back to the toggle or the trigger only when it was in the
	// header: a menu opened by hover leaves focus where it was on the page.
	escape(): void {
		const hadFocus = this.#root.contains(document.activeElement)
		const target = compact.matches ? this.#toggle : this.#currentTrigger
		this.dismiss()
		if (hadFocus) target?.focus()
	}

	positionPreview(link: HTMLElement): void {
		this.#morph.preview(
			this.#scenes.find(
				scene => scene.dataset.scene === link.dataset.preview,
			),
			link,
		)
	}

	adaptToBreakpoint(): void {
		const hasFocus = this.#root.contains(document.activeElement)
		const target = compact.matches
			? this.#toggle
			: (this.#currentTrigger ?? this.#triggers[0])
		this.dismiss()
		this.positionPanel()
		if (hasFocus) target?.focus()
	}

	dismissOnFocusExit(event: FocusEvent): void {
		const next = event.relatedTarget
		if (next instanceof Node && this.#root.contains(next)) return
		// A breakpoint can hide focus before its change event fires.
		const hasHiddenFocus =
			!next &&
			event.target instanceof Element &&
			!event.target.checkVisibility()
		this.dismiss()
		const target = compact.matches ? this.#toggle : this.#triggers[0]
		if (hasHiddenFocus) target?.focus()
	}
}

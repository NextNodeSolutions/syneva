import { compact } from './compact'
import { NavigationMorph } from './navigation-morph'
import { TOGGLE_LABEL } from './toggle-label'

import type { NavigationParts } from './navigation-parts'

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

// Keys that move focus along the bar's triggers, wrapping at both ends.
const ARROWS: Record<string, (index: number, count: number) => number> = {
	ArrowRight: (index, count) => (index + 1) % count,
	ArrowLeft: (index, count) => (index + count - 1) % count,
	Home: () => 0,
	End: (_index, count) => count - 1,
}

type InputMode = 'pointer' | 'keyboard'

export class Navigation {
	readonly #root: HTMLElement
	readonly #links: HTMLElement
	readonly #triggers: HTMLElement[]
	readonly #dropdown: HTMLElement
	readonly #toggle: HTMLElement
	readonly #panels: HTMLElement[]
	readonly #previewLinks: HTMLElement[]
	readonly #scenes: HTMLElement[]
	readonly #morph: NavigationMorph
	#currentTrigger: HTMLElement | undefined
	#clickedTrigger: HTMLElement | undefined
	#currentPanel: HTMLElement | undefined
	#previewedLink: HTMLElement | undefined
	// Whether the phone bar is open; #renderBar() writes it to the page.
	#isBarOpen = false
	#openTimer: ReturnType<typeof setTimeout> | undefined
	#closeTimer: ReturnType<typeof setTimeout> | undefined

	constructor(parts: NavigationParts) {
		this.#root = parts.root
		this.#links = parts.links
		this.#dropdown = parts.dropdown
		this.#toggle = parts.toggle
		this.#triggers = parts.triggers
		this.#panels = parts.panels
		this.#previewLinks = parts.previewLinks
		this.#scenes = parts.scenes
		this.#morph = new NavigationMorph(parts, compact)
		// The product menu starts on its first row's preview.
		const [first] = this.#previewLinks
		if (first) this.selectPreview(first)
	}

	get isOpen(): boolean {
		return Boolean(this.#currentPanel) || this.#isBarOpen
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
		if (this.#previewedLink) this.#positionPreview(this.#previewedLink)
	}

	// inert alone holds a panel's state: it takes the closed panels out of
	// the accessibility tree and the tab order, and the styles key on it.
	#hidePanel(): void {
		this.#currentTrigger?.setAttribute('aria-expanded', 'false')
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
		this.#isBarOpen = false
		this.#renderBar()
		if (shouldRestore) this.#toggle.focus()
	}

	// The styles read data-mobile-open; the toggle reports the state and
	// names the action it offers.
	#renderBar(): void {
		const state = this.#isBarOpen ? 'open' : 'closed'
		this.#root.dataset.mobileOpen = String(this.#isBarOpen)
		this.#toggle.setAttribute('aria-expanded', String(this.#isBarOpen))
		this.#toggle.setAttribute('aria-label', TOGGLE_LABEL[state])
	}

	#showPanel(trigger: HTMLElement, mode: InputMode = 'pointer'): void {
		this.cancelTimers()
		this.#root.dataset.input = mode
		if (trigger === this.#currentTrigger) return
		this.#clickedTrigger = undefined
		if (this.#dropdown.contains(document.activeElement)) trigger.focus()
		this.#hidePanel()
		const panel = this.#panels.find(
			candidate => candidate.id === trigger.getAttribute('aria-controls'),
		)
		this.#currentTrigger = trigger
		this.#currentPanel = panel
		this.positionPanel()
		if (panel) panel.inert = false
		trigger.setAttribute('aria-expanded', 'true')
		this.#dropdown.dataset.open = 'true'
	}

	#focusPanel(trigger: HTMLElement): void {
		this.#showPanel(trigger, 'keyboard')
		this.#currentPanel?.querySelector('a')?.focus()
	}

	// A key on a trigger moves along the bar or, with ArrowDown, into the
	// trigger's panel. Returns whether the key was such a move.
	moveFrom(trigger: HTMLElement, key: string): boolean {
		if (key === 'ArrowDown') {
			this.#focusPanel(trigger)
			return true
		}
		const move = ARROWS[key]
		if (!move) return false
		const count = this.#triggers.length
		const next =
			this.#triggers[move(this.#triggers.indexOf(trigger), count)]
		next?.focus()
		if (next) this.#showPanel(next, 'keyboard')
		return true
	}

	scheduleOpen(trigger: HTMLElement, event: PointerEvent): void {
		if (compact.matches || !isMouse(event)) return
		this.cancelTimers()
		this.#openTimer = setTimeout(
			() => this.#showPanel(trigger),
			this.#currentPanel ? 0 : OPEN_DELAY_MS,
		)
	}

	activate(trigger: HTMLElement, event: MouseEvent): void {
		if (isKeyboardActivation(event)) {
			this.#focusPanel(trigger)
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
		this.#showPanel(trigger)
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
		if (this.#isBarOpen) {
			this.dismiss()
			return
		}
		const [first] = this.#triggers
		if (!first) return
		this.#isBarOpen = true
		this.#renderBar()
		const isKeyboard = isKeyboardActivation(event)
		this.#showPanel(first, isKeyboard ? 'keyboard' : 'pointer')
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

	// A product row previews its scene: the shared selection background moves
	// to the row, and the row and its scene are marked for the styles.
	selectPreview(link: HTMLElement): void {
		this.#previewedLink = link
		this.#positionPreview(link)
		this.#previewLinks.forEach(candidate =>
			candidate.classList.toggle('is-previewed', candidate === link),
		)
		this.#scenes.forEach(scene =>
			scene.classList.toggle(
				'is-current',
				scene.dataset.scene === link.dataset.preview,
			),
		)
	}

	#positionPreview(link: HTMLElement): void {
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

	dismissOnOutsidePress(event: PointerEvent): void {
		if (event.target instanceof Node && this.#root.contains(event.target))
			return
		this.dismiss()
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

import { compact } from './compact'
import { HoverIntent } from './hover-intent'
import { NavigationMorph } from './navigation-morph'
import { PhoneBar } from './phone-bar'
import { ProductPreview } from './product-preview'

import type { InputMode } from './input-mode'
import type { NavigationParts } from './navigation-parts'

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

type Focusable = { focus: () => void }

// The header's panel state and focus: hover and click open a section's panel
// in the morphing dropdown, arrow keys move between triggers, Escape and
// outside presses dismiss, and on phones the toggle opens the link bar first.
// Hover timing, the phone bar and the product preview live in their own
// classes.
export class Navigation {
	readonly #root: HTMLElement
	readonly #links: HTMLElement
	readonly #triggers: HTMLElement[]
	readonly #dropdown: HTMLElement
	readonly #panels: HTMLElement[]
	readonly #morph: NavigationMorph
	readonly #preview: ProductPreview
	readonly #hoverIntent = new HoverIntent()
	readonly #phoneBar: PhoneBar
	#currentTrigger: HTMLElement | undefined
	#clickedTrigger: HTMLElement | undefined
	#currentPanel: HTMLElement | undefined
	#inputMode: InputMode = 'pointer'

	constructor(parts: NavigationParts) {
		this.#root = parts.root
		this.#links = parts.links
		this.#dropdown = parts.dropdown
		this.#phoneBar = new PhoneBar(parts.root, parts.toggle)
		this.#triggers = parts.triggers
		this.#panels = parts.panels
		this.#morph = new NavigationMorph(parts, compact)
		this.#preview = new ProductPreview(parts, this.#morph)
	}

	get isOpen(): boolean {
		return Boolean(this.#currentPanel) || this.#phoneBar.isOpen
	}

	keepOpen(): void {
		this.#hoverIntent.keepOpen()
	}

	// The pointer reached the dropdown: a pending switch or close is void.
	holdCurrentPanel(): void {
		this.#hoverIntent.cancel()
	}

	positionPanel(): void {
		this.#morph.position(this.#currentTrigger, this.#currentPanel)
		this.#preview.reposition()
	}

	// inert alone holds a panel's state: it takes the closed panels out of
	// the accessibility tree and the tab order, and the styles key on it.
	#hidePanel(): void {
		this.#currentTrigger?.setAttribute('aria-expanded', 'false')
		if (this.#currentPanel) this.#currentPanel.inert = true
	}

	#closePanel(): void {
		this.#hoverIntent.cancel()
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
		this.#phoneBar.close()
		if (shouldRestore) this.#phoneBar.focus()
	}

	#showPanel(trigger: HTMLElement, mode: InputMode = 'pointer'): void {
		this.#hoverIntent.cancel()
		this.#setInputMode(mode)
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
		this.#hoverIntent.scheduleOpen(
			() => this.#showPanel(trigger),
			this.#currentPanel ? 'open' : 'closed',
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
			this.#inputMode === 'keyboard'
		)
			return
		this.#hoverIntent.scheduleClose(() => this.#closePanel())
	}

	enterKeyboardMode(): void {
		this.#setInputMode('keyboard')
		this.#morph.finish()
	}

	// data-input is for the styles; the morph is told directly.
	#setInputMode(mode: InputMode): void {
		this.#inputMode = mode
		this.#root.dataset.input = mode
		this.#morph.setInputMode(mode)
	}

	toggleBar(event: MouseEvent): void {
		if (this.#phoneBar.isOpen) {
			this.dismiss()
			return
		}
		const [first] = this.#triggers
		if (!first) return
		this.#phoneBar.open()
		const isKeyboard = isKeyboardActivation(event)
		this.#showPanel(first, isKeyboard ? 'keyboard' : 'pointer')
		if (isKeyboard) first.focus()
	}

	// Focus goes back to the toggle or the trigger only when it was in the
	// header: a menu opened by hover leaves focus where it was on the page.
	escape(): void {
		const hadFocus = this.#root.contains(document.activeElement)
		const target = this.#returnTarget(this.#currentTrigger)
		this.dismiss()
		if (hadFocus) target?.focus()
	}

	selectPreview(link: HTMLElement): void {
		this.#preview.select(link)
	}

	adaptToBreakpoint(): void {
		const hasFocus = this.#root.contains(document.activeElement)
		const target = this.#returnTarget(
			this.#currentTrigger ?? this.#triggers[0],
		)
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
		if (hasHiddenFocus) this.#returnTarget(this.#triggers[0])?.focus()
	}

	// Where focus returns as the menu closes: on phones the toggle, since the
	// dismissal folds the bar and hides the triggers, else the given trigger.
	#returnTarget(trigger: HTMLElement | undefined): Focusable | undefined {
		return compact.matches ? this.#phoneBar : trigger
	}
}

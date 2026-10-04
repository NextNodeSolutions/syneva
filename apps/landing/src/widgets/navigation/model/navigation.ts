import { compact } from './compact'
import { HoverIntent } from './hover-intent'
import { NavigationMorph } from './navigation-morph'
import { PhoneBar } from './phone-bar'
import { ProductPreview } from './product-preview'

import type { InputMode } from './input-mode'
import type { NavigationParts, SectionMenu } from './navigation-parts'

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
	readonly #menus: NavigationParts['menus']
	readonly #dropdown: HTMLElement
	readonly #morph: NavigationMorph
	readonly #preview: ProductPreview
	readonly #hoverIntent = new HoverIntent()
	readonly #phoneBar: PhoneBar
	#openMenu: SectionMenu | undefined
	#clickedMenu: SectionMenu | undefined
	#inputMode: InputMode = 'pointer'

	constructor(parts: NavigationParts) {
		this.#root = parts.root
		this.#links = parts.links
		this.#dropdown = parts.dropdown
		this.#phoneBar = new PhoneBar(parts.root, parts.toggle)
		this.#menus = parts.menus
		this.#morph = new NavigationMorph(parts)
		this.#preview = new ProductPreview(parts, this.#morph)
	}

	get isOpen(): boolean {
		return Boolean(this.#openMenu) || this.#phoneBar.isOpen
	}

	keepOpen(): void {
		this.#hoverIntent.keepOpen()
	}

	// The pointer reached the dropdown: a pending switch or close is void.
	holdCurrentPanel(): void {
		this.#hoverIntent.cancel()
	}

	positionPanel(): void {
		this.#morph.position(this.#openMenu)
		this.#preview.reposition()
	}

	// The inert attribute alone holds a panel's state: it takes the closed
	// panels out of the accessibility tree and the tab order, and the styles
	// key on it. The attribute is toggled, not the property, so a browser
	// without inert still restyles the panel.
	#hidePanel(): void {
		this.#openMenu?.trigger.setAttribute('aria-expanded', 'false')
		this.#openMenu?.panel.toggleAttribute('inert', true)
	}

	#closePanel(): void {
		this.#hoverIntent.cancel()
		if (this.#dropdown.contains(document.activeElement))
			this.#openMenu?.trigger.focus()
		this.#hidePanel()
		this.#morph.close()
		this.#dropdown.dataset.open = 'false'
		this.#openMenu = undefined
		this.#clickedMenu = undefined
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

	#showPanel(menu: SectionMenu, mode: InputMode = 'pointer'): void {
		this.#hoverIntent.cancel()
		this.#setInputMode(mode)
		if (menu === this.#openMenu) return
		this.#clickedMenu = undefined
		if (this.#dropdown.contains(document.activeElement))
			menu.trigger.focus()
		this.#hidePanel()
		this.#openMenu = menu
		this.positionPanel()
		menu.panel.toggleAttribute('inert', false)
		menu.trigger.setAttribute('aria-expanded', 'true')
		this.#dropdown.dataset.open = 'true'
	}

	#focusPanel(menu: SectionMenu): void {
		this.#showPanel(menu, 'keyboard')
		menu.panel.querySelector('a')?.focus()
	}

	// A key on a trigger moves along the bar or, with ArrowDown, into the
	// trigger's panel. Returns whether the key was such a move.
	moveFrom(menu: SectionMenu, key: string): boolean {
		if (key === 'ArrowDown') {
			this.#focusPanel(menu)
			return true
		}
		const move = ARROWS[key]
		if (!move) return false
		const count = this.#menus.length
		const next = this.#menus[move(this.#menus.indexOf(menu), count)]
		next?.trigger.focus()
		if (next) this.#showPanel(next, 'keyboard')
		return true
	}

	scheduleOpen(menu: SectionMenu, event: PointerEvent): void {
		if (compact.matches) return
		this.#hoverIntent.scheduleOpen(
			event,
			() => this.#showPanel(menu),
			this.#openMenu ? 'open' : 'closed',
		)
	}

	activate(menu: SectionMenu, event: MouseEvent): void {
		if (isKeyboardActivation(event)) {
			this.#focusPanel(menu)
			return
		}
		if (this.#openMenu === menu && this.#clickedMenu === menu) {
			this.#closePanel()
			return
		}
		// Hover may already have opened it before the first deliberate click.
		this.#showPanel(menu)
		this.#clickedMenu = menu
	}

	scheduleClose(event: PointerEvent): void {
		if (compact.matches || this.#inputMode === 'keyboard') return
		this.#hoverIntent.scheduleClose(event, () => this.#closePanel())
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
		const [first] = this.#menus
		this.#phoneBar.open()
		const isKeyboard = isKeyboardActivation(event)
		this.#showPanel(first, isKeyboard ? 'keyboard' : 'pointer')
		if (isKeyboard) first.trigger.focus()
	}

	// Focus goes back to the toggle or the trigger only when it was in the
	// header: a menu opened by hover leaves focus where it was on the page.
	escape(): void {
		const hadFocus = this.#root.contains(document.activeElement)
		const target = this.#returnTarget(this.#openMenu?.trigger)
		this.dismiss()
		if (hadFocus) target?.focus()
	}

	selectPreview(link: HTMLElement): void {
		this.#preview.select(link)
	}

	adaptToBreakpoint(): void {
		const hasFocus = this.#root.contains(document.activeElement)
		const target = this.#returnTarget(
			this.#openMenu?.trigger ?? this.#menus[0].trigger,
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
		// A breakpoint can hide focus before its change event fires; a hidden
		// element has no boxes (checkVisibility is missing in Safari before 17.4).
		const hasHiddenFocus =
			!next &&
			event.target instanceof Element &&
			!event.target.getClientRects().length
		this.dismiss()
		if (hasHiddenFocus) this.#returnTarget(this.#menus[0].trigger)?.focus()
	}

	// Where focus returns as the menu closes: on phones the toggle, since the
	// dismissal folds the bar and hides the triggers, else the given trigger.
	#returnTarget(trigger: HTMLElement | undefined): Focusable | undefined {
		return compact.matches ? this.#phoneBar : trigger
	}
}

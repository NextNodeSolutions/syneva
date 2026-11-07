import { compact } from './compact'
import { HoverIntent } from './hover-intent'
import { panelTabTarget, TRIGGER_MOVES } from './keyboard-order'
import { NavigationMorph } from './navigation-morph'
import { PhoneBar } from './phone-bar'
import { ProductPreview } from './product-preview'

import type { InputMode } from './input-mode'
import type { TabDirection } from './keyboard-order'
import type { NavigationParts, SectionMenu } from './navigation-parts'

// A click without a press count came from the keyboard (Enter or Space).
const isKeyboardActivation = (event: MouseEvent): boolean => event.detail === 0

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
		this.#phoneBar = new PhoneBar(parts)
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

	// The inert attribute alone holds a panel's state: it takes closed panels out of the accessibility tree and tab order, and the styles key on it.
	// Toggle the attribute, not the property, so a browser without inert still restyles the panel.
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
		this.#phoneBar.close(this.#inputMode)
		if (shouldRestore) this.#phoneBar.focus()
	}

	// Focus moves, before the dismissal, to what the dismissal leaves shown (phones: the toggle; else the open or first trigger), so the dismissal has nothing to restore. A hover-opened menu leaves focus where it was.
	#dismissRestoringFocus(focused: EventTarget | null): void {
		const target = compact.matches
			? this.#phoneBar
			: (this.#openMenu?.trigger ?? this.#menus[0].trigger)
		if (focused instanceof Node && this.#root.contains(focused))
			target.focus()
		this.dismiss()
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

	moveFrom(menu: SectionMenu, key: string): boolean {
		if (key === 'ArrowDown') {
			this.#focusPanel(menu)
			return true
		}
		const move = TRIGGER_MOVES[key]
		if (!move) return false
		const count = this.#menus.length
		const next = this.#menus[move(this.#menus.indexOf(menu), count)]
		next?.trigger.focus()
		if (next) this.#showPanel(next, 'keyboard')
		return true
	}

	tabAround(from: EventTarget | null, direction: TabDirection): boolean {
		const menu = this.#openMenu
		if (!menu || !(from instanceof Element)) return false
		const header = { root: this.#root, dropdown: this.#dropdown, menu }
		const target = panelTabTarget(header, from, direction)
		if (!target) return false
		target.focus()
		if (!menu.panel.contains(target) && target !== menu.trigger)
			this.#closePanel()
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
		const mode = isKeyboardActivation(event) ? 'keyboard' : 'pointer'
		this.#phoneBar.open(mode)
		this.#showPanel(first, mode)
		if (mode === 'keyboard') first.trigger.focus()
	}

	escape(): void {
		this.#dismissRestoringFocus(document.activeElement)
	}

	selectPreview(link: HTMLElement): void {
		this.#preview.select(link)
	}

	adaptToBreakpoint(): void {
		this.#dismissRestoringFocus(document.activeElement)
		this.positionPanel()
	}

	dismissOnOutsidePress(event: PointerEvent): void {
		if (event.target instanceof Node && this.#root.contains(event.target))
			return
		this.dismiss()
	}

	dismissOnFocusExit(event: FocusEvent): void {
		const next = event.relatedTarget
		if (next instanceof Node) {
			if (!this.#root.contains(next)) this.dismiss()
			return
		}
		// Only a breakpoint hiding the focused element before its change event fires dismisses here (a hidden element has no boxes, and checkVisibility is missing in Safari before 17.4).
		if (
			event.target instanceof Element &&
			!event.target.getClientRects().length
		)
			this.#dismissRestoringFocus(event.target)
	}
}

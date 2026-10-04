import { TOGGLE_LABEL } from './toggle-label'

// The link bar the toggle opens on phones. One field holds whether it is
// open, and #render() writes it where it is read: data-mobile-open for the
// styles, aria-expanded and the label on the toggle.
export class PhoneBar {
	readonly #root: HTMLElement
	readonly #toggle: HTMLElement
	#isOpen = false

	constructor(root: HTMLElement, toggle: HTMLElement) {
		this.#root = root
		this.#toggle = toggle
	}

	get isOpen(): boolean {
		return this.#isOpen
	}

	open(): void {
		this.#isOpen = true
		this.#render()
	}

	close(): void {
		this.#isOpen = false
		this.#render()
	}

	// The toggle is the bar's one control, so focus lands there.
	focus(): void {
		this.#toggle.focus()
	}

	#render(): void {
		const state = this.#isOpen ? 'open' : 'closed'
		this.#root.dataset.mobileOpen = String(this.#isOpen)
		this.#toggle.setAttribute('aria-expanded', String(this.#isOpen))
		this.#toggle.setAttribute('aria-label', TOGGLE_LABEL[state])
	}
}

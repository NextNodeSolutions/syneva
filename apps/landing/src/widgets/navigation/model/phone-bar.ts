// The link bar the toggle opens on phones. One field holds whether it is
// open, and #render() writes it where it is read: data-mobile-open for the
// styles, aria-expanded on the toggle. The toggle's name stays "Menu", the
// word it shows, so speech input can call it (WCAG 2.5.3).
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
		this.#root.dataset.mobileOpen = String(this.#isOpen)
		this.#toggle.setAttribute('aria-expanded', String(this.#isOpen))
	}
}

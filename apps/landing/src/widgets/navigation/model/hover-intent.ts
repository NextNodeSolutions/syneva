// Hover intent on the bar: a mouse resting on a trigger opens its panel
// after a short pause, or at once while another panel is open, and leaving
// the header closes the panel after a pause long enough to cross into the
// dropdown.
const OPEN_DELAY_MS = 60
const SWITCH_DELAY_MS = 0
const CLOSE_DELAY_MS = 180

type MenuState = 'closed' | 'open'

export class HoverIntent {
	#openTimer: ReturnType<typeof setTimeout> | undefined
	#closeTimer: ReturnType<typeof setTimeout> | undefined

	scheduleOpen(open: () => void, menu: MenuState): void {
		this.cancel()
		this.#openTimer = setTimeout(
			open,
			menu === 'open' ? SWITCH_DELAY_MS : OPEN_DELAY_MS,
		)
	}

	scheduleClose(close: () => void): void {
		clearTimeout(this.#openTimer)
		this.#closeTimer = setTimeout(close, CLOSE_DELAY_MS)
	}

	keepOpen(): void {
		clearTimeout(this.#closeTimer)
	}

	cancel(): void {
		clearTimeout(this.#openTimer)
		clearTimeout(this.#closeTimer)
	}
}

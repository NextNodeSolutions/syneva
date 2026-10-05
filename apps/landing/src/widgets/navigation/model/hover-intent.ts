// Hover intent on the bar: a mouse resting on a trigger opens its panel
// after a short pause, or at once while another panel is open, and leaving
// the header closes the panel after a pause long enough to cross into the
// dropdown.
const OPEN_DELAY_MS = 60
const SWITCH_DELAY_MS = 0
const CLOSE_DELAY_MS = 180

type MenuState = 'closed' | 'open'

// It follows a mouse only: a touch or pen lift fires pointerleave too, which
// would close the panel the tap just opened.
const isMouse = (event: PointerEvent): boolean => event.pointerType === 'mouse'

export class HoverIntent {
	#openTimer: ReturnType<typeof setTimeout> | undefined
	#closeTimer: ReturnType<typeof setTimeout> | undefined

	scheduleOpen(event: PointerEvent, open: () => void, menu: MenuState): void {
		if (!isMouse(event)) return
		this.cancel()
		this.#openTimer = setTimeout(
			open,
			menu === 'open' ? SWITCH_DELAY_MS : OPEN_DELAY_MS,
		)
	}

	scheduleClose(event: PointerEvent, close: () => void): void {
		if (!isMouse(event)) return
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

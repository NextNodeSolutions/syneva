import { reducedMotion } from '@syneva/motion/preference'

import { compact } from './compact'
import { NAV_CLOCK } from './nav-clock'

import type { InputMode } from './input-mode'

// Open, or folding back into the toggle on its way to closed.
type BarState = 'open' | 'folding' | 'closed'

const ATTRIBUTE: Record<BarState, string> = {
	open: 'true',
	folding: 'folding',
	closed: 'false',
}
const MS_PER_S = 1000

// The link bar the toggle opens on phones. One field holds its state, and
// #render() writes it where it is read: data-mobile-open for the styles,
// aria-expanded on the toggle. Closed by the pointer, the bar first folds
// back into the toggle (its keyframes run for NAV_CLOCK.duration.fold), and
// is closed for the toggle and the runtime from the start of the fold; from
// the keyboard, or with reduced motion, it closes at once. The toggle's name
// stays "Menu", the word it shows, so speech input can call it (WCAG 2.5.3).
export class PhoneBar {
	readonly #root: HTMLElement
	readonly #toggle: HTMLElement
	#state: BarState = 'closed'
	#foldTimer: ReturnType<typeof setTimeout> | undefined

	constructor(root: HTMLElement, toggle: HTMLElement) {
		this.#root = root
		this.#toggle = toggle
	}

	get isOpen(): boolean {
		return this.#state === 'open'
	}

	open(): void {
		this.#setState('open')
	}

	close(mode: InputMode): void {
		const folds =
			this.#state === 'open' &&
			mode === 'pointer' &&
			compact.matches &&
			!reducedMotion.matches
		if (!folds) {
			this.#setState('closed')
			return
		}
		this.#setState('folding')
		this.#foldTimer = setTimeout(
			() => this.#setState('closed'),
			NAV_CLOCK.duration.fold * MS_PER_S,
		)
	}

	// The toggle is the bar's one control, so focus lands there.
	focus(): void {
		this.#toggle.focus()
	}

	#setState(state: BarState): void {
		clearTimeout(this.#foldTimer)
		this.#state = state
		this.#render()
	}

	#render(): void {
		this.#root.dataset.mobileOpen = ATTRIBUTE[this.#state]
		this.#toggle.setAttribute('aria-expanded', String(this.isOpen))
	}
}

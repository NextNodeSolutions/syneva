import type { DockParts } from './navigation-parts'

const DOCK_AT_PX = 8

type Tick = { element: HTMLElement; at: number }

const share = (fraction: number): number => Math.min(Math.max(fraction, 0), 1)

// Past the page's top, data-docked restyles the header into its floating sheet whose bottom edge rules the reading position; the ticks come from the page's own #main > section elements, so every page gets its own ruler.
export class HeaderDock {
	readonly #root: HTMLElement
	readonly #ruler: HTMLElement
	readonly #progress: HTMLElement
	readonly #tick: HTMLElement
	#ticks: Tick[] = []
	#range = 1
	#isDocked: boolean | undefined

	constructor(
		root: HTMLElement,
		{
			ruler,
			progress,
			tick,
		}: Pick<DockParts, 'ruler' | 'progress' | 'tick'>,
	) {
		this.#root = root
		this.#ruler = ruler
		this.#progress = progress
		this.#tick = tick
	}

	// A page that loads (or is restored) already scrolled docks without the move: the header it would condense from was never on screen. The flag holds two frames: the docked pose and the one before the transitions return.
	start(scrollY: number): void {
		this.measure()
		if (scrollY <= DOCK_AT_PX) {
			this.follow(scrollY)
			return
		}
		this.#root.dataset.dockInstant = ''
		this.follow(scrollY)
		requestAnimationFrame(() =>
			requestAnimationFrame(() => {
				delete this.#root.dataset.dockInstant
			}),
		)
	}

	measure(): void {
		this.#range = Math.max(
			document.documentElement.scrollHeight - window.innerHeight,
			1,
		)
		const reach = window.scrollY - this.#root.offsetHeight
		const sections = [
			...document.querySelectorAll<HTMLElement>('#main > section'),
		].slice(1)
		this.#ticks.forEach(({ element }) => element.remove())
		this.#ticks = sections.map(section => {
			const at = share(
				(section.getBoundingClientRect().top + reach) / this.#range,
			)
			const element = this.#tick.cloneNode(true)
			if (!(element instanceof HTMLElement))
				throw new Error('The ruler tick must be an element.')
			element.style.setProperty('--at', String(at))
			return { element, at }
		})
		this.#ruler.append(...this.#ticks.map(({ element }) => element))
		this.follow(window.scrollY)
	}

	follow(scrollY: number): void {
		const isDocked = scrollY > DOCK_AT_PX
		if (isDocked !== this.#isDocked) {
			this.#isDocked = isDocked
			this.#root.dataset.docked = String(isDocked)
		}
		const progress = share(scrollY / this.#range)
		this.#progress.style.transform = `scaleX(${progress})`
		this.#ticks.forEach(({ element, at }) =>
			element.toggleAttribute('data-passed', progress >= at),
		)
	}
}

import type { DockParts } from './navigation-parts'

// Past this many pixels from the top the header docks.
const DOCK_AT_PX = 8

// A section's tick and where it sits on the ruler, as a share of the scroll.
type Tick = { element: HTMLElement; at: number }

const share = (fraction: number): number => Math.min(Math.max(fraction, 0), 1)

// The header's dock: once the page leaves its top, data-docked restyles the
// header into its floating sheet (dock.styles.ts), and the sheet's bottom
// edge rules the reading position, with a tick where each section of the page
// begins. The ticks come from the page's own sections (the document's
// #main > section), so every page gets its own ruler.
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

	// A page that loads (or is restored) already scrolled docks without the
	// move: the header it would condense from was never on screen. The
	// instant flag holds for two frames, the docked pose's and the one before
	// the transitions return.
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

	// The scroll range, and where each section after the first meets the
	// docked header.
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

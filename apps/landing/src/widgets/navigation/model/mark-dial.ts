import { reducedMotion } from '@syneva/motion/preference'

// It springs onto the nearest quarter turn, where the eight rays around a diamond look exactly as they started - a detent, not a spinner: it never turns on its own.
const DEGREES_PER_PX = 0.25
const DETENT_DEG = 90
const FULL_TURN_DEG = 360
const REST_AFTER_MS = 140
const STIFFNESS = 200
const DAMPING = 20
const SETTLED = 0.05
// A long frame (a background tab) must not throw the spring: it steps at most one frame of a 30fps clock at a time.
const SLOWEST_FPS = 30
const MAX_STEP_S = 1 / SLOWEST_FPS
const MS_PER_S = 1000

export class MarkDial {
	readonly #mark: SVGGElement
	#angle = 0
	#velocity = 0
	#restTimer: ReturnType<typeof setTimeout> | undefined
	#frame: number | undefined

	constructor(mark: SVGGElement) {
		this.#mark = mark
		reducedMotion.addEventListener('change', () => {
			if (reducedMotion.matches) this.#rest(0)
		})
	}

	turn(scrolledPx: number): void {
		if (reducedMotion.matches || scrolledPx === 0) return
		this.#stopSpring()
		this.#angle += scrolledPx * DEGREES_PER_PX
		this.#render()
		clearTimeout(this.#restTimer)
		this.#restTimer = setTimeout(() => this.#settle(), REST_AFTER_MS)
	}

	#settle(): void {
		const detent = Math.round(this.#angle / DETENT_DEG) * DETENT_DEG
		let last = performance.now()
		this.#velocity = 0
		const step = (time: number): void => {
			const elapsed = Math.min((time - last) / MS_PER_S, MAX_STEP_S)
			last = time
			const force =
				STIFFNESS * (detent - this.#angle) - DAMPING * this.#velocity
			this.#velocity += force * elapsed
			this.#angle += this.#velocity * elapsed
			const isSettled =
				Math.abs(detent - this.#angle) < SETTLED &&
				Math.abs(this.#velocity) < SETTLED
			if (isSettled) {
				this.#rest(detent % FULL_TURN_DEG)
				return
			}
			this.#render()
			this.#frame = requestAnimationFrame(step)
		}
		this.#frame = requestAnimationFrame(step)
	}

	#rest(angle: number): void {
		clearTimeout(this.#restTimer)
		this.#stopSpring()
		this.#angle = angle
		this.#velocity = 0
		this.#render()
	}

	#stopSpring(): void {
		// requestAnimationFrame ids start at 1.
		if (this.#frame) cancelAnimationFrame(this.#frame)
		this.#frame = undefined
	}

	#render(): void {
		this.#mark.style.transform = `rotate(${this.#angle}deg)`
	}
}

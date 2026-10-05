import { animate } from '@syneva/motion/engine'
import { reducedMotion } from '@syneva/motion/preference'

import { phoneBar } from '../ui/nav.stylex'

import { compact } from './compact'
import { NAV_CLOCK } from './nav-clock'

import type { Bezier } from '@syneva/motion/easing'
import type { InputMode } from './input-mode'
import type { NavigationParts } from './navigation-parts'

// Open, or folding back into the toggle on its way to closed.
type BarState = 'open' | 'folding' | 'closed'

const ATTRIBUTE: Record<BarState, string> = {
	open: 'true',
	folding: 'folding',
	closed: 'false',
}

// What the reveal animates: the bar's clip and its opacity.
type Pose = { clipPath: string; opacity: number }
type Move = { duration: number; ease: Bezier }
// Where a move heads, on which timing, and what follows once it lands.
type Target = { pose: Pose; move: Move; onLand: () => void }

const UNFOLDED: Pose = {
	clipPath: `inset(0px 0px 0px 0px round ${phoneBar.radius})`,
	opacity: 1,
}
const UNFOLD: Move = {
	duration: NAV_CLOCK.duration.bar,
	ease: NAV_CLOCK.unfoldEase,
}
const FOLD: Move = { duration: NAV_CLOCK.duration.fold, ease: NAV_CLOCK.ease }

// The link bar the toggle opens on phones. One field holds its state, and
// #render() writes it where it is read: data-mobile-open for the styles,
// aria-expanded on the toggle. Opened by the pointer, the bar uncovers out of
// the toggle above it, a clip whose words never scale; closed by the
// pointer, it first folds back into the toggle, closed for the toggle and
// the runtime from the start of the fold. Every move starts from the bar's
// live pose, so reopening during a fold reverses it instead of jumping shut
// first. From the keyboard, or with reduced motion, the bar opens and closes
// at once. The toggle's name stays "Menu", the word it shows, so speech input
// can call it (WCAG 2.5.3).
export class PhoneBar {
	readonly #root: HTMLElement
	readonly #toggle: HTMLElement
	readonly #bar: HTMLElement
	#state: BarState = 'closed'
	#motion: ReturnType<typeof animate> | undefined

	constructor({
		root,
		toggle,
		links,
	}: Pick<NavigationParts, 'root' | 'toggle' | 'links'>) {
		this.#root = root
		this.#toggle = toggle
		this.#bar = links
	}

	get isOpen(): boolean {
		return this.#state === 'open'
	}

	open(mode: InputMode): void {
		if (this.#state === 'open') return
		// Read before the state changes: a closed bar has no pose to read.
		const from = this.#state === 'folding' ? this.#livePose() : undefined
		this.#setState('open')
		this.#move(from ?? this.#foldedPose(), mode, {
			pose: UNFOLDED,
			move: UNFOLD,
			onLand: () => {},
		})
	}

	close(mode: InputMode): void {
		if (this.#state !== 'open') return
		const from = this.#livePose()
		this.#setState('folding')
		this.#move(from, mode, {
			pose: this.#foldedPose(),
			move: FOLD,
			onLand: () => this.#setState('closed'),
		})
	}

	// The toggle is the bar's one control, so focus lands there.
	focus(): void {
		this.#toggle.focus()
	}

	#move(from: Pose, mode: InputMode, { pose, move, onLand }: Target): void {
		this.#stop()
		const isAnimated =
			mode === 'pointer' && compact.matches && !reducedMotion.matches
		if (!isAnimated) {
			onLand()
			return
		}
		const motion = animate(
			this.#bar,
			{
				clipPath: [from.clipPath, pose.clipPath],
				opacity: [from.opacity, pose.opacity],
			},
			{
				duration: move.duration,
				ease: move.ease,
				onComplete: () => {
					if (this.#motion !== motion) return
					this.#stop()
					onLand()
				},
			},
		)
		this.#motion = motion
	}

	// The bar returns to its own styles: no clip, full opacity. A cancelled
	// move never lands (Motion completes a move only when it finishes).
	#stop(): void {
		this.#motion?.cancel()
		this.#motion = undefined
		this.#bar.style.removeProperty('clip-path')
		this.#bar.style.removeProperty('opacity')
	}

	// The running move holds the live values.
	#livePose(): Pose {
		const styles = getComputedStyle(this.#bar)
		return {
			clipPath:
				styles.clipPath === 'none'
					? UNFOLDED.clipPath
					: styles.clipPath,
			opacity: Number(styles.opacity),
		}
	}

	// Folded into the toggle above the bar: a zero-height clip across the
	// toggle's own width.
	#foldedPose(): Pose {
		const bar = this.#bar.getBoundingClientRect()
		const toggle = this.#toggle.getBoundingClientRect()
		const left = Math.max(toggle.left - bar.left, 0)
		const right = Math.max(bar.right - toggle.right, 0)
		return {
			clipPath: `inset(0px ${right}px 100% ${left}px round ${phoneBar.radius})`,
			opacity: 0,
		}
	}

	#setState(state: BarState): void {
		this.#state = state
		this.#render()
	}

	#render(): void {
		this.#root.dataset.mobileOpen = ATTRIBUTE[this.#state]
		this.#toggle.setAttribute('aria-expanded', String(this.isOpen))
	}
}

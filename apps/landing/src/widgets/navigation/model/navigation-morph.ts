import { toBezier } from '@syneva/motion/easing'
import { animate } from '@syneva/motion/engine'
import { reducedMotion } from '@syneva/motion/preference'

import {
	canInterpolate,
	CONTENT,
	channelValues,
	contentFrames,
	GEOMETRY,
	read,
	registerChannel,
	seconds,
} from './navigation-channels'
import { measureNavigation } from './navigation-geometry'

import type { Channel, Frames, Values } from './navigation-channels'

type Clock = 'menu' | 'preview'
type Motion = { target: Values; controls?: ReturnType<typeof animate> }

// Menu geometry and content share one clock; preview hovers run on their own,
// so selecting a product row never restarts the menu's movement. Each clock
// samples its rendered pose before retargeting.
export class NavigationMorph {
	readonly #navigation: HTMLElement
	readonly #panels: HTMLElement[]
	readonly #scenes: HTMLElement[]
	readonly #compact: MediaQueryList
	readonly #shell: Channel
	readonly #panelChannels: Channel[]
	readonly #sceneChannels: Channel[]
	readonly #motions: Record<Clock, Motion> = {
		menu: { target: {} },
		preview: { target: {} },
	}
	#folded: Record<string, number> | undefined

	constructor(
		navigation: HTMLElement,
		panels: HTMLElement[],
		scenes: HTMLElement[],
		compact: MediaQueryList,
	) {
		this.#navigation = navigation
		this.#panels = panels
		this.#scenes = scenes
		this.#compact = compact
		this.#shell = registerChannel(navigation, '', GEOMETRY)
		this.#panelChannels = panels.map((panel, index) =>
			registerChannel(panel, `panel-${index}-`, CONTENT),
		)
		this.#sceneChannels = scenes.map((scene, index) =>
			registerChannel(scene, `scene-${index}-`, CONTENT),
		)
		reducedMotion.addEventListener('change', () => {
			if (reducedMotion.matches) this.finish()
		})
	}

	#isInstant(): boolean {
		return (
			reducedMotion.matches ||
			this.#navigation.dataset.input === 'keyboard' ||
			!canInterpolate
		)
	}

	#animateTo(clock: Clock, next: Values, seeds: Values = {}): void {
		const motion = this.#motions[clock]
		if (
			Object.entries(next).every(
				([key, entry]) => motion.target[key] === entry,
			)
		)
			return
		const styles = getComputedStyle(this.#navigation)
		const destination = { ...motion.target, ...next }
		const origin = Object.fromEntries(
			Object.keys(destination).map(key => [key, read(styles, key)]),
		)
		const timing = next[this.#shell.reveal ?? ''] === '0' ? 'close' : clock
		const duration = seconds(read(styles, `--nav-${timing}-duration`))
		const frames = contentFrames({ ...origin, ...seeds }, destination, [
			this.#panelChannels,
			this.#sceneChannels,
		])
		motion.controls?.cancel()
		motion.controls = undefined
		motion.target = destination
		Object.entries(destination).forEach(([key, entry]) =>
			this.#navigation.style.setProperty(key, entry),
		)
		if (this.#isInstant()) {
			if (clock === 'preview') this.#settleScenes()
			return
		}
		const controls = this.#play(frames, duration)
		motion.controls = controls
		if (clock === 'preview') void this.#settleAfter(controls)
	}

	// One animation per channel on the shared clock: the menu ease spans the
	// whole move and the hand-over keyframes are linear in its progress.
	#play(frames: Frames, duration: number): ReturnType<typeof animate> {
		const ease = toBezier(
			read(getComputedStyle(this.#navigation), '--nav-ease'),
		)
		const keyframes = Object.fromEntries(
			[...frames].map(([name, frame]) => [name, frame.values]),
		)
		const perChannel = Object.fromEntries(
			[...frames].map(([name, frame]) => [
				name,
				{ inherit: true, times: frame.times },
			]),
		)
		return animate(this.#navigation, keyframes, {
			duration,
			ease,
			...perChannel,
		})
	}

	async #settleAfter(controls: ReturnType<typeof animate>): Promise<void> {
		await controls.finished
		if (this.#motions.preview.controls === controls) this.#settleScenes()
	}

	#settleScenes(): void {
		this.#scenes.forEach((scene, index) => {
			const progress = this.#sceneChannels[index]?.progress ?? ''
			if (this.#motions.preview.target[progress] === '0')
				scene.classList.remove('is-illustrating')
		})
	}

	#revealChannels(
		clock: Clock,
		selected: number,
		travel: number,
	): { next: Values; seeds: Values } {
		const channels =
			clock === 'menu' ? this.#panelChannels : this.#sceneChannels
		const previous = channels.findIndex(
			channel =>
				this.#motions[clock].target[channel.progress ?? ''] === '1',
		)
		const direction = selected < previous ? -1 : 1
		const styles = getComputedStyle(this.#navigation)
		const next: Values = {}
		const seeds: Values = {}
		channels.forEach((channel, index) => {
			const isSelected = index === selected
			Object.assign(
				next,
				channelValues(channel, {
					progress: isSelected ? 1 : 0,
					opacity: isSelected ? 1 : 0,
					offset: isSelected ? 0 : -direction * travel,
				}),
			)
			if (
				isSelected &&
				Number(read(styles, channel.progress ?? '')) === 0
			)
				seeds[channel.offset ?? ''] = String(direction * travel)
		})
		return { next, seeds }
	}

	position(
		trigger: HTMLElement | undefined,
		panel: HTMLElement | undefined,
	): void {
		const geometry = measureNavigation({
			navigation: this.#navigation,
			trigger,
			panel,
			compact: this.#compact,
		})
		if (!geometry || !panel) return
		this.#folded = geometry.folded
		const styles = getComputedStyle(this.#navigation)
		const travel = Number.parseFloat(read(styles, '--nav-panel-travel'))
		const content = this.#revealChannels(
			'menu',
			this.#panels.indexOf(panel),
			travel,
		)
		const next = {
			...channelValues(this.#shell, { ...geometry.open, reveal: 1 }),
			...content.next,
		}
		const isHidden = Number(read(styles, this.#shell.reveal ?? '')) === 0
		const seeds = isHidden
			? { ...channelValues(this.#shell, this.#folded), ...content.seeds }
			: content.seeds
		this.#animateTo('menu', next, seeds)
	}

	close(): void {
		if (!this.#folded) return
		const content = Object.fromEntries(
			this.#panelChannels.flatMap(channel => [
				[channel.progress ?? '', '0'],
				[channel.opacity ?? '', '0'],
			]),
		)
		this.#animateTo('menu', {
			...channelValues(this.#shell, { ...this.#folded, reveal: 0 }),
			...content,
		})
	}

	preview(scene: HTMLElement | undefined, link: HTMLElement): void {
		if (!scene) return
		// Keep an outgoing illustration alive until its shared fade completes.
		scene.classList.add('is-illustrating')
		const travel = Number.parseFloat(
			read(getComputedStyle(this.#navigation), '--nav-preview-travel'),
		)
		const content = this.#revealChannels(
			'preview',
			this.#scenes.indexOf(scene),
			travel,
		)
		const selection = channelValues(this.#shell, {
			'selection-y': link.offsetTop,
			'selection-height': link.offsetHeight,
		})
		this.#animateTo(
			'preview',
			{ ...content.next, ...selection },
			content.seeds,
		)
	}

	finish(): void {
		Object.values(this.#motions).forEach(motion =>
			motion.controls?.cancel(),
		)
		this.#settleScenes()
	}
}

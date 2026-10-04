import { toBezier } from '@syneva/motion/easing'
import { animate } from '@syneva/motion/engine'
import { reducedMotion } from '@syneva/motion/preference'

import { readProperty, toSeconds } from './computed-style'
import { contentFrames } from './handover-frames'
import {
	canInterpolate,
	CONTENT,
	channelValues,
	GEOMETRY,
	registerChannel,
} from './navigation-channels'
import { measureNavigation } from './navigation-geometry'
import { revealChannels } from './reveal-channels'

import type { Frames } from './handover-frames'
import type { InputMode } from './input-mode'
import type { Channel, Values } from './navigation-channels'
import type { NavigationParts } from './navigation-parts'

type Clock = 'menu' | 'preview'
type Motion = { target: Values; controls?: ReturnType<typeof animate> }

// Menu geometry and content share one clock; preview hovers run on their own,
// so selecting a product row never restarts the menu's movement. Each clock
// samples its rendered pose before retargeting.
export class NavigationMorph {
	readonly #navigation: HTMLElement
	readonly #links: HTMLElement
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
	#inputMode: InputMode = 'pointer'

	constructor(
		{
			root,
			links,
			panels,
			scenes,
		}: Pick<NavigationParts, 'root' | 'links' | 'panels' | 'scenes'>,
		compact: MediaQueryList,
	) {
		this.#navigation = root
		this.#links = links
		this.#panels = panels
		this.#scenes = scenes
		this.#compact = compact
		this.#shell = registerChannel(root, '', GEOMETRY)
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
			this.#inputMode === 'keyboard' ||
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
			Object.keys(destination).map(key => [
				key,
				readProperty(styles, key),
			]),
		)
		const timing = next[this.#shell.reveal ?? ''] === '0' ? 'close' : clock
		const duration = toSeconds(
			readProperty(styles, `--nav-${timing}-duration`),
		)
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
			readProperty(getComputedStyle(this.#navigation), '--nav-ease'),
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

	position(
		trigger: HTMLElement | undefined,
		panel: HTMLElement | undefined,
	): void {
		const geometry = measureNavigation({
			navigation: this.#navigation,
			links: this.#links,
			trigger,
			panel,
			compact: this.#compact,
		})
		if (!geometry || !panel) return
		this.#folded = geometry.folded
		const styles = getComputedStyle(this.#navigation)
		const travel = Number.parseFloat(
			readProperty(styles, '--nav-panel-travel'),
		)
		const content = revealChannels({
			channels: this.#panelChannels,
			target: this.#motions.menu.target,
			selected: this.#panels.indexOf(panel),
			travel,
			styles,
		})
		const next = {
			...channelValues(this.#shell, { ...geometry.open, reveal: 1 }),
			...content.next,
		}
		const isHidden =
			Number(readProperty(styles, this.#shell.reveal ?? '')) === 0
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
		const styles = getComputedStyle(this.#navigation)
		const content = revealChannels({
			channels: this.#sceneChannels,
			target: this.#motions.preview.target,
			selected: this.#scenes.indexOf(scene),
			travel: Number.parseFloat(
				readProperty(styles, '--nav-preview-travel'),
			),
			styles,
		})
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

	setInputMode(mode: InputMode): void {
		this.#inputMode = mode
	}

	finish(): void {
		Object.values(this.#motions).forEach(motion =>
			motion.controls?.cancel(),
		)
		this.#settleScenes()
	}
}

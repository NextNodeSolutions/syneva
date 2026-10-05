import { animate } from '@syneva/motion/engine'
import { reducedMotion } from '@syneva/motion/preference'

import { handoverFrames } from './handover-frames'
import { NAV_CLOCK } from './nav-clock'
import {
	canInterpolate,
	CONTENT,
	GEOMETRY,
	registerChannel,
} from './navigation-channels'
import { availableWidth, measureNavigation } from './navigation-geometry'
import { readProperty } from './read-property'
import { revealChannels } from './reveal-channels'

import type { navBounds } from '../ui/nav.stylex'
import type { HandoverFrames } from './handover-frames'
import type { InputMode } from './input-mode'
import type {
	Channel,
	ChannelValues,
	ContentName,
	GeometryName,
} from './navigation-channels'
import type { Geometry } from './navigation-geometry'
import type { NavigationParts, SectionMenu } from './navigation-parts'

type Clock = 'menu' | 'preview'
type Motion = { target: ChannelValues; controls?: ReturnType<typeof animate> }
// The bounds the morph measures and writes; nav.stylex.ts declares them.
type BoundName = Extract<keyof typeof navBounds, `--${string}`>

// Menu geometry and content share one clock; preview hovers run on their own,
// so selecting a product row never restarts the menu's movement. Each clock
// samples its rendered pose before retargeting.
export class NavigationMorph {
	readonly #navigation: HTMLElement
	readonly #links: HTMLElement
	readonly #panels: HTMLElement[]
	readonly #scenes: HTMLElement[]
	readonly #shell: Channel<GeometryName>
	readonly #panelChannels: Channel<ContentName>[]
	readonly #sceneChannels: Channel<ContentName>[]
	readonly #motions: Record<Clock, Motion> = {
		menu: { target: {} },
		preview: { target: {} },
	}
	#folded: Geometry['folded'] | undefined
	#inputMode: InputMode = 'pointer'

	constructor({
		root,
		links,
		menus,
		scenes,
	}: Pick<NavigationParts, 'root' | 'links' | 'menus' | 'scenes'>) {
		this.#navigation = root
		this.#links = links
		this.#panels = menus.map(({ panel }) => panel)
		this.#scenes = scenes
		this.#shell = registerChannel(root, '', GEOMETRY)
		this.#panelChannels = this.#panels.map((panel, index) =>
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

	#animateTo(
		clock: Clock,
		next: ChannelValues,
		seeds: ChannelValues = {},
	): void {
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
		const timing =
			next[this.#shell.property('reveal')] === '0' ? 'close' : clock
		// A move on either clock, or the fold back on closing.
		const duration = NAV_CLOCK.duration[timing]
		const frames = handoverFrames({ ...origin, ...seeds }, destination, [
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
	#play(
		frames: HandoverFrames,
		duration: number,
	): ReturnType<typeof animate> {
		const { ease } = NAV_CLOCK
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
		this.#sceneChannels.forEach((channel, index) => {
			const progress = channel.property('progress')
			if (this.#motions.preview.target[progress] === '0')
				this.#scenes[index]?.classList.remove('is-illustrating')
		})
	}

	position(menu: SectionMenu | undefined): void {
		// A panel's width reads --nav-available: write it before measuring.
		this.#setPixels('--nav-available', availableWidth(this.#navigation))
		if (!menu) return
		const geometry = measureNavigation({
			navigation: this.#navigation,
			links: this.#links,
			...menu,
		})
		this.#setPixels('--dropdown-max-height', geometry.maxHeight.dropdown)
		this.#setPixels('--panel-max-height', geometry.maxHeight.panel)
		this.#folded = geometry.folded
		const styles = getComputedStyle(this.#navigation)
		const content = revealChannels({
			channels: this.#panelChannels,
			target: this.#motions.menu.target,
			selected: this.#panels.indexOf(menu.panel),
			travel: NAV_CLOCK.travel.panel,
			styles,
		})
		const next = {
			...this.#shell.values({ ...geometry.open, reveal: 1 }),
			...content.next,
		}
		const reveal = readProperty(styles, this.#shell.property('reveal'))
		const seeds =
			Number(reveal) === 0
				? { ...this.#shell.values(this.#folded), ...content.seeds }
				: content.seeds
		this.#animateTo('menu', next, seeds)
	}

	#setPixels(name: BoundName, pixels: number): void {
		this.#navigation.style.setProperty(name, `${pixels}px`)
	}

	close(): void {
		if (!this.#folded) return
		const content = this.#panelChannels.flatMap(channel =>
			Object.entries(channel.values({ progress: 0, opacity: 0 })),
		)
		this.#animateTo('menu', {
			...this.#shell.values({ ...this.#folded, reveal: 0 }),
			...Object.fromEntries(content),
		})
	}

	preview(scene: HTMLElement, link: HTMLElement): void {
		// Keep an outgoing illustration alive until its shared fade completes.
		scene.classList.add('is-illustrating')
		const styles = getComputedStyle(this.#navigation)
		const content = revealChannels({
			channels: this.#sceneChannels,
			target: this.#motions.preview.target,
			selected: this.#scenes.indexOf(scene),
			travel: NAV_CLOCK.travel.preview,
			styles,
		})
		const selection = this.#shell.values({
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

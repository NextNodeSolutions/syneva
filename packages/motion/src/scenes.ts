import { inView } from 'motion'

import { reducedMotion } from './preference'

import type { animate } from './animate'

// Offscreen scenes, hidden tabs and reduced motion pause every animation
// inside a [data-motion-scene]. Scenes that start animating later (a reveal,
// a timeline) call syncScenes() right after, so new animations are paused
// before their first frame if their scene is out of view.
const SCENE_AMOUNT = 0.05
const visible = new Set<Element>()

type Controls = ReturnType<typeof animate>

// An entrance replays when its scene resumes after a pause that caught it
// finished. The stylesheet animations this runtime replaces did exactly that:
// a paused animation sitting at its end restarts from zero on play() (the
// browser's auto-rewind), so a drawing that comes back into view, or a tab
// that comes back to the front, draws itself again. Motion releases an
// animation once it lands, so the entrance is started again instead.
export class Entrance {
	readonly #start: () => Controls
	#controls: Controls | undefined
	#isFinished = false
	#isRewound = false

	constructor(start: () => Controls) {
		this.#start = start
	}

	// Starts, or starts over, from the first frame.
	play(): void {
		this.#isFinished = false
		this.#isRewound = false
		const controls = this.#start()
		this.#controls = controls
		void this.#settle(controls)
	}

	async #settle(controls: Controls): Promise<void> {
		await controls.finished
		if (this.#controls === controls) this.#isFinished = true
	}

	pause(): void {
		this.#isRewound ||= this.#isFinished
	}

	resume(): void {
		if (this.#isRewound) this.play()
	}
}

const entrances = new Map<Element, Entrance[]>()

// An entrance that belongs to the element's scene, not started yet.
export function sceneEntrance(
	element: Element,
	start: () => Controls,
): Entrance {
	const entrance = new Entrance(start)
	const scene = element.closest('[data-motion-scene]')
	if (scene) entrances.set(scene, [...(entrances.get(scene) ?? []), entrance])
	return entrance
}

export function playEntrance(element: Element, start: () => Controls): void {
	sceneEntrance(element, start).play()
}

function pauseScene(scene: Element): void {
	for (const entrance of entrances.get(scene) ?? []) entrance.pause()
	for (const animation of scene.getAnimations({ subtree: true }))
		animation.pause()
}

function resumeScene(scene: Element): void {
	for (const animation of scene.getAnimations({ subtree: true }))
		if (animation.playState === 'paused') animation.play()
	for (const entrance of entrances.get(scene) ?? []) entrance.resume()
}

export function syncScenes(): void {
	const isGloballyPaused = reducedMotion.matches || document.hidden
	// Stylesheet-driven loops (the menu's preview lines) pause on this flag.
	document.documentElement.toggleAttribute(
		'data-motion-paused',
		isGloballyPaused,
	)
	for (const scene of document.querySelectorAll('[data-motion-scene]')) {
		if (isGloballyPaused || !visible.has(scene)) pauseScene(scene)
		else resumeScene(scene)
	}
}

// Kept in module scope: the observer must outlive the call that created it.
let stopWatching: (() => void) | undefined

export function watchScenes(): void {
	stopWatching?.()
	stopWatching = inView(
		'[data-motion-scene]',
		scene => {
			visible.add(scene)
			syncScenes()
			return () => {
				visible.delete(scene)
				syncScenes()
			}
		},
		{ amount: SCENE_AMOUNT },
	)
	reducedMotion.addEventListener('change', syncScenes)
	document.addEventListener('visibilitychange', syncScenes)
}

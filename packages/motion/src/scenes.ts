import { ATTRIBUTE } from './attributes'
import { inView } from './engine'
import { reducedMotion } from './preference'

// A [data-motion-scene] pauses its animations while out of view or tab-hidden, and resumes each where it paused on return; reduced motion pauses loops and finishes entrances.
// A scene that starts animating later (a reveal, a timeline) syncs right after, so new animations pause before their first frame when hidden.
const SCENE = `[${ATTRIBUTE.scene}]`
const SCENE_AMOUNT = 0.05
const visibleScenes = new Set<Element>()

// A paused animation is never rewound: play() on one sitting at its end restarts it from frame 0
// (Web Animations auto-rewind) - a finished element vanishing and re-entering. One past its end is
// finished instead, so Motion commits the final pose.
const isPastEnd = (animation: Animation): boolean =>
	Number(animation.currentTime) >=
	Number(animation.effect?.getComputedTiming().endTime ?? Infinity)

function pauseScene(scene: Element): void {
	for (const animation of scene.getAnimations({ subtree: true }))
		if (animation.playState === 'running') animation.pause()
}

// An entrance is finished (never held mid-flight or in its delay) or the hidden pose would keep the element invisible once the poses are off.
const isLoop = (animation: Animation): boolean =>
	animation.effect?.getComputedTiming().endTime === Infinity

function settleScene(scene: Element): void {
	pauseScene(scene)
	for (const animation of scene.getAnimations({ subtree: true }))
		if (!isLoop(animation)) animation.finish()
}

function resumeScene(scene: Element): void {
	for (const animation of scene.getAnimations({ subtree: true })) {
		if (animation.playState !== 'paused') continue
		if (isPastEnd(animation)) animation.finish()
		else animation.play()
	}
}

const scenesWithin = (root: Element | Document): Element[] => [
	...(root instanceof Element && root.matches(SCENE) ? [root] : []),
	...root.querySelectorAll(SCENE),
]

export function syncScenes(root: Element | Document = document): void {
	const isGloballyPaused = reducedMotion.matches || document.hidden
	// Stylesheet-driven loops (the menu's preview lines) pause on this flag.
	document.documentElement.toggleAttribute(
		'data-motion-paused',
		isGloballyPaused,
	)
	for (const scene of scenesWithin(root))
		if (reducedMotion.matches) settleScene(scene)
		else if (document.hidden || !visibleScenes.has(scene)) pauseScene(scene)
		else resumeScene(scene)
}

// Resync on a preference switch or tab change; calling syncScenes directly would take the listener's event for the root.
const resyncScenes = (): void => {
	syncScenes()
}

export function watchScenes(): void {
	reducedMotion.addEventListener('change', resyncScenes)
	document.addEventListener('visibilitychange', resyncScenes)
	inView(
		SCENE,
		scene => {
			visibleScenes.add(scene)
			syncScenes(scene)
			return () => {
				visibleScenes.delete(scene)
				syncScenes(scene)
			}
		},
		{ amount: SCENE_AMOUNT },
	)
}

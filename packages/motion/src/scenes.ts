import { inView } from 'motion'

import { reducedMotion } from './preference'

// Offscreen scenes, hidden tabs and reduced motion pause every animation
// inside a [data-motion-scene]; a scene that comes back resumes each one
// where it paused. Scenes that start animating later (a reveal, a timeline)
// sync themselves right after, so new animations are paused before their
// first frame if their scene is out of view.
const SCENE = '[data-motion-scene]'
const SCENE_AMOUNT = 0.05
const visible = new Set<Element>()

// Entrances play once. Only a running animation is paused, and a paused one
// is never rewound: play() on an animation sitting at its end restarts it
// from its first frame (the Web Animations auto-rewind), which shows as a
// finished element vanishing and entering again. One that waited at its end
// is finished instead, so Motion commits its final pose.
const isPastEnd = (animation: Animation): boolean =>
	Number(animation.currentTime) >=
	Number(animation.effect?.getComputedTiming().endTime ?? Infinity)

function pauseScene(scene: Element): void {
	for (const animation of scene.getAnimations({ subtree: true }))
		if (animation.playState === 'running') animation.pause()
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

// Syncs the scenes under `root` (every scene by default) to their visibility.
export function syncScenes(root: Element | Document = document): void {
	const isGloballyPaused = reducedMotion.matches || document.hidden
	// Stylesheet-driven loops (the menu's preview lines) pause on this flag.
	document.documentElement.toggleAttribute(
		'data-motion-paused',
		isGloballyPaused,
	)
	for (const scene of scenesWithin(root))
		if (isGloballyPaused || !visible.has(scene)) pauseScene(scene)
		else resumeScene(scene)
}

// Kept in module scope: the observer must outlive the call that created it.
let stopWatching: (() => void) | undefined

export function watchScenes(): void {
	stopWatching?.()
	stopWatching = inView(
		SCENE,
		scene => {
			visible.add(scene)
			syncScenes(scene)
			return () => {
				visible.delete(scene)
				syncScenes(scene)
			}
		},
		{ amount: SCENE_AMOUNT },
	)
}

reducedMotion.addEventListener('change', () => syncScenes())
document.addEventListener('visibilitychange', () => syncScenes())

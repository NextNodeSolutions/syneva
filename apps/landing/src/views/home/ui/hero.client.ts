import { booted } from '@syneva/motion/boot'
import { reducedMotion } from '@syneva/motion/preference'
import { syncScenes } from '@syneva/motion/scenes'

import { choreograph } from './hero-choreography'
import { playIntro } from './hero-intro'
import { palette } from './hero-palette'
import { bindPointer } from './hero-pointer'
import { stagePartSelector } from './hero-stage-part'

import type { Scope } from './hero-timeline'

// The markup is the static pose, so cancelling the round lands every piece there; reduced motion never starts it and lands the headline's entrance on its finished pose at once.
const hero = document.querySelector<HTMLElement>('[data-hero]')
const svg = hero?.querySelector('[data-hero-stage]')

const scope: Scope = {
	one: name => {
		const part = svg?.querySelector(stagePartSelector(name))
		if (!(part instanceof SVGElement))
			throw new Error(
				`The hero stage has no ${name} part: mark an element of its <svg> with stagePart('${name}').`,
			)
		return part
	},
	all: name => [...(svg?.querySelectorAll(stagePartSelector(name)) ?? [])],
}

let isRunning = false

function start(): void {
	if (isRunning || !svg) return
	isRunning = true
	choreograph(scope, palette())
	syncScenes()
}

function stop(): void {
	if (!isRunning || !svg) return
	isRunning = false
	svg.getAnimations({ subtree: true }).forEach(animation =>
		animation.cancel(),
	)
}

// The preference is read live: switching to reduce cancels the running round, switching back restarts it.
reducedMotion.addEventListener('change', () => {
	if (reducedMotion.matches) stop()
	else start()
})

if (hero && svg) {
	if (!reducedMotion.matches) start()
	bindPointer(hero, scope)
}
await booted()
const intro = playIntro()
// Completed under reduced motion, the entrance commits its finished pose, so a later switch to no-preference never arms a hidden pose over it.
if (reducedMotion.matches) intro.forEach(entrance => entrance.complete())
syncScenes()

import { queries } from '@syneva/design-system/media.stylex'
import { booted } from '@syneva/motion/boot'
import { retimeLoop } from '@syneva/motion/loop-timeline'
import { reducedMotion } from '@syneva/motion/preference'
import { syncScenes } from '@syneva/motion/scenes'

import { playCircuit } from './circuit-loop'
import { travelSignals } from './circuit-signals'
import { placeLoopLabel, routeCircuit } from './circuit-wires'

import type { SignalName } from './circuit-part'

// Route the wires now, again when the phone layout swaps the viewBox and once the fonts settled (they can shift a port by a pixel).
// Then run the loop unless reduced motion; the loop runs once: a preference switch during the boot wait starts it early, and the boot leaves it running.
const phone = matchMedia(queries.phone)
const svg = document.querySelector<SVGSVGElement>('svg[data-circuit]')

let lengths = new Map<SignalName, number>()
let isRunning = false

// A running loop keeps its place on the clock; only its signals' travel follows the new routes.
function route(circuit: SVGSVGElement): void {
	lengths = routeCircuit(circuit)
	placeLoopLabel(circuit)
	if (isRunning) travelSignals(circuit, lengths, retimeLoop)
}

function start(circuit: SVGSVGElement): void {
	if (isRunning) return
	isRunning = true
	playCircuit(circuit, lengths)
	syncScenes()
}

function stop(circuit: SVGSVGElement): void {
	isRunning = false
	circuit
		.getAnimations({ subtree: true })
		.forEach(animation => animation.cancel())
}

if (svg) {
	route(svg)
	phone.addEventListener('change', () => route(svg))
	reducedMotion.addEventListener('change', () => {
		if (reducedMotion.matches) stop(svg)
		else start(svg)
	})
	await booted()
	route(svg)
	if (!reducedMotion.matches) start(svg)
}

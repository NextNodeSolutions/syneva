import { queries } from '@syneva/design-system/media.stylex'
import { booted } from '@syneva/motion/boot'
import { reducedMotion } from '@syneva/motion/preference'
import { syncScenes } from '@syneva/motion/scenes'

import { playCircuit, retimeSignals } from './circuit-loop'
import { routeCircuit } from './circuit-routing'

// The review circuit's runtime: route the wires now, again when the phone
// frame swaps and once the fonts settled (they can shift a port by a pixel),
// then run the loop unless the visitor prefers reduced motion. The loop runs
// once: a preference switch during the boot wait starts it early, and the
// boot then leaves it running.
const compact = matchMedia(queries.phone)
const svg = document.querySelector<SVGSVGElement>('svg[data-circuit]')

let lengths = new Map<string, number>()
let isRunning = false

// A running loop keeps its place on the clock; only its signals' travel
// follows the new routes.
function route(circuit: SVGSVGElement): void {
	lengths = routeCircuit(circuit, compact.matches)
	if (isRunning) retimeSignals(circuit, lengths)
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
	compact.addEventListener('change', () => route(svg))
	reducedMotion.addEventListener('change', () => {
		if (reducedMotion.matches) stop(svg)
		else start(svg)
	})
	await booted()
	route(svg)
	if (!reducedMotion.matches) start(svg)
}

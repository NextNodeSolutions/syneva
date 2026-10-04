import { queries } from '@syneva/design-system/media.stylex'
import { booted } from '@syneva/motion/boot'
import { reducedMotion } from '@syneva/motion/preference'
import { syncScenes } from '@syneva/motion/scenes'

import { playCircuit, retimeSignals } from './circuit-loop'
import { routeCircuit } from './circuit-routing'

// The review circuit's runtime: route the wires now, again when the phone
// frame swaps and once the fonts settled (they can shift a port by a pixel),
// then run the loop unless the visitor prefers reduced motion.
const compact = matchMedia(queries.phone)
const svg = document.querySelector<SVGSVGElement>('svg[data-circuit]')

function start(circuit: SVGSVGElement): void {
	playCircuit(circuit, routeCircuit(circuit, compact.matches))
	syncScenes()
}

if (svg) {
	routeCircuit(svg, compact.matches)
	compact.addEventListener('change', () =>
		retimeSignals(svg, routeCircuit(svg, compact.matches)),
	)
	reducedMotion.addEventListener('change', () => {
		svg.getAnimations({ subtree: true }).forEach(animation =>
			animation.cancel(),
		)
		if (!reducedMotion.matches) start(svg)
	})
	await booted()
	if (reducedMotion.matches) routeCircuit(svg, compact.matches)
	else start(svg)
}

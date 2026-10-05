import { RETURN_WIRE, WIRES } from './circuit-layout'
import { signalSelector } from './circuit-part'
import { loopLabelAt, routeWire } from './circuit-routing'

import type { SignalName } from './circuit-part'

// The circuit's wires are re-routed from the ports' live positions: ports
// include their responsive station transforms, and each signal references
// its wire through <use>, so the two can never disagree. Routes are measured
// once per layout (frame swap, fonts), never per animation frame.
function portPosition(svg: SVGSVGElement, id: string): DOMPoint {
	const port = svg.querySelector(`#${id}`)
	if (!(port instanceof SVGCircleElement))
		throw new Error(
			`The review circuit has no port #${id}: its platform draws it from PORTS in circuit-layout.ts.`,
		)
	const point = new DOMPoint(port.cx.baseVal.value, port.cy.baseVal.value)
	const local = port.getCTM()
	const root = svg.getCTM()
	if (!local || !root)
		throw new Error(
			`The review circuit's port #${id} has no rendered transform: the drawing and its stations must stay rendered (never display: none).`,
		)
	return point.matrixTransform(local).matrixTransform(root.inverse())
}

function wirePath(svg: SVGSVGElement, id: string): SVGPathElement {
	const path = svg.querySelector(`#${id}`)
	if (!(path instanceof SVGPathElement))
		throw new Error(
			`The review circuit has no wire #${id}: Circuit.astro draws it from WIRES in circuit-layout.ts.`,
		)
	return path
}

// Returns each route's length, keyed by the signal that travels it.
export function routeCircuit(svg: SVGSVGElement): Map<SignalName, number> {
	const lengths = new Map<SignalName, number>()
	for (const { id, from, to, route, signal } of WIRES) {
		const path = wirePath(svg, id)
		path.setAttribute(
			'd',
			routeWire(route, portPosition(svg, from), portPosition(svg, to)),
		)
		const length = path.getTotalLength()
		lengths.set(signal, length)
		const signalUse = svg.querySelector<SVGElement>(signalSelector(signal))
		if (!signalUse)
			throw new Error(
				`The circuit wire #${id} carries no ${signal} signal: Circuit.astro draws it from WIRES with signalPart('${signal}').`,
			)
		signalUse.style.setProperty('--route-length', `${length}px`)
	}
	return lengths
}

// The loop label follows the return wire's live ports.
export function placeLoopLabel(svg: SVGSVGElement): void {
	const label = svg.querySelector('[data-loop-label]')
	if (!label)
		throw new Error(
			'The review circuit places its loop label under its return wire: it needs a [data-loop-label] text.',
		)
	const { x, y } = loopLabelAt(
		portPosition(svg, RETURN_WIRE.from),
		portPosition(svg, RETURN_WIRE.to),
	)
	label.setAttribute('x', String(x))
	label.setAttribute('y', String(y))
}

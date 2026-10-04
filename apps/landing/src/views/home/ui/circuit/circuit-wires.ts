import { signalOnWire } from './circuit-part'
import { loopLabelAt, routeWire } from './circuit-routing'

import type { Route } from './circuit-routing'

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
	if (!local || !root) return point
	return point.matrixTransform(local).matrixTransform(root.inverse())
}

// A wire names the ports it joins: without one it would route from the
// drawing's corner.
function portOf(wire: SVGPathElement, end: 'from' | 'to'): string {
	const port = wire.dataset[end]
	if (!port)
		throw new Error(
			`The circuit wire #${wire.id} names no ${end} port: give it data-${end}.`,
		)
	return port
}

const routeOf = (path: SVGPathElement): Route =>
	path.dataset.route === 'return' ? 'return' : 'forward'

// Returns each route's length, keyed by the path id its signal travels.
export function routeCircuit(svg: SVGSVGElement): Map<string, number> {
	const lengths = new Map<string, number>()
	svg.querySelectorAll<SVGPathElement>('[data-from]').forEach(path => {
		const from = portPosition(svg, portOf(path, 'from'))
		const to = portPosition(svg, portOf(path, 'to'))
		path.setAttribute('d', routeWire(routeOf(path), from, to))
		const length = path.getTotalLength()
		lengths.set(path.id, length)
		const signal = svg.querySelector<SVGElement>(signalOnWire(path.id))
		if (!signal)
			throw new Error(
				`The circuit wire #${path.id} carries no signal: add a <use> with signalPart() that references it.`,
			)
		signal.style.setProperty('--route-length', `${length}px`)
	})
	return lengths
}

// The loop label follows the return wire's live ports.
export function placeLoopLabel(svg: SVGSVGElement): void {
	const route = svg.querySelector<SVGPathElement>('[data-route="return"]')
	const label = svg.querySelector('[data-loop-label]')
	if (!route || !label)
		throw new Error(
			'The review circuit places its loop label under its return wire: it needs both a [data-route="return"] wire and a [data-loop-label] text.',
		)
	const { x, y } = loopLabelAt(
		portPosition(svg, portOf(route, 'from')),
		portPosition(svg, portOf(route, 'to')),
	)
	label.setAttribute('x', String(x))
	label.setAttribute('y', String(y))
}

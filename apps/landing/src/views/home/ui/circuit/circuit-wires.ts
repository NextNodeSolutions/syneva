import { RETURN_WIRE, WIRES } from './circuit-layout'
import { signalOnWire } from './circuit-part'
import { loopLabelAt, routeWire } from './circuit-routing'

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

function wirePath(svg: SVGSVGElement, id: string): SVGPathElement {
	const path = svg.querySelector(`#${id}`)
	if (!(path instanceof SVGPathElement))
		throw new Error(
			`The review circuit has no wire #${id}: Circuit.astro draws it from WIRES in circuit-layout.ts.`,
		)
	return path
}

// Returns each route's length, keyed by the path id its signal travels.
export function routeCircuit(svg: SVGSVGElement): Map<string, number> {
	const lengths = new Map<string, number>()
	for (const { id, from, to, route } of WIRES) {
		const path = wirePath(svg, id)
		path.setAttribute(
			'd',
			routeWire(route, portPosition(svg, from), portPosition(svg, to)),
		)
		const length = path.getTotalLength()
		lengths.set(id, length)
		const signal = svg.querySelector<SVGElement>(signalOnWire(id))
		if (!signal)
			throw new Error(
				`The circuit wire #${id} carries no signal: add a <use> with signalPart() that references it.`,
			)
		signal.style.setProperty('--route-length', `${length}px`)
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

import { loopLabelAt, routeWire } from './circuit-routing'

import type { Route } from './circuit-routing'

// The circuit's wires are re-routed from the ports' live positions: ports
// include their responsive station transforms, and each signal references
// its wire through <use>, so the two can never disagree. Routes are measured
// once per layout (frame swap, fonts), never per animation frame.
function portPosition(svg: SVGSVGElement, id: string): DOMPoint {
	const port = svg.querySelector(`#${id}`)
	if (!(port instanceof SVGCircleElement)) return new DOMPoint()
	const point = new DOMPoint(port.cx.baseVal.value, port.cy.baseVal.value)
	const local = port.getCTM()
	const root = svg.getCTM()
	if (!local || !root) return point
	return point.matrixTransform(local).matrixTransform(root.inverse())
}

const routeOf = (path: SVGPathElement): Route =>
	path.dataset.route === 'return' ? 'return' : 'forward'

// Returns each route's length, keyed by the path id its signal travels.
export function routeCircuit(svg: SVGSVGElement): Map<string, number> {
	const lengths = new Map<string, number>()
	svg.querySelectorAll<SVGPathElement>('[data-from]').forEach(path => {
		const from = portPosition(svg, path.dataset.from ?? '')
		const to = portPosition(svg, path.dataset.to ?? '')
		path.setAttribute('d', routeWire(routeOf(path), from, to))
		const length = path.getTotalLength()
		lengths.set(path.id, length)
		svg.querySelector<SVGElement>(
			`[href="#${path.id}"][data-signal]`,
		)?.style.setProperty('--route-length', `${length}px`)
	})
	return lengths
}

// The loop label follows the return wire's live ports.
export function placeLoopLabel(svg: SVGSVGElement): void {
	const route = svg.querySelector<SVGPathElement>('[data-route="return"]')
	const label = svg.querySelector('[data-loop-label]')
	if (!route || !label) return
	const { x, y } = loopLabelAt(
		portPosition(svg, route.dataset.from ?? ''),
		portPosition(svg, route.dataset.to ?? ''),
	)
	label.setAttribute('x', String(x))
	label.setAttribute('y', String(y))
}

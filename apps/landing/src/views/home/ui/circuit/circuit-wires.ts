import { loopLabelAt, routeWire } from './circuit-routing'

// The circuit's wires are re-routed from the ports' live positions: ports
// include their responsive station transforms, and each signal references
// its wire through <use>, so the two can never disagree. Routes are measured
// once per layout (frame swap, fonts), never per animation frame.
const WIDE = '0 0 1160 480'
const COMPACT = '130 0 900 520'

function portPosition(svg: SVGSVGElement, id: string): DOMPoint {
	const port = svg.querySelector(`#${id}`)
	if (!(port instanceof SVGCircleElement)) return new DOMPoint()
	const point = new DOMPoint(port.cx.baseVal.value, port.cy.baseVal.value)
	const local = port.getCTM()
	const root = svg.getCTM()
	if (!local || !root) return point
	return point.matrixTransform(local).matrixTransform(root.inverse())
}

// Returns each route's length, keyed by the path id its signal travels.
export function routeCircuit(
	svg: SVGSVGElement,
	isCompact: boolean,
): Map<string, number> {
	svg.setAttribute('viewBox', isCompact ? COMPACT : WIDE)
	const lengths = new Map<string, number>()
	const label = svg.querySelector('[data-loop-label]')
	svg.querySelectorAll<SVGPathElement>('[data-from]').forEach(path => {
		const from = portPosition(svg, path.dataset.from ?? '')
		const to = portPosition(svg, path.dataset.to ?? '')
		const route = path.dataset.route === 'return' ? 'return' : 'forward'
		path.setAttribute('d', routeWire(route, from, to))
		const length = path.getTotalLength()
		lengths.set(path.id, length)
		svg.querySelector<SVGElement>(
			`[href="#${path.id}"][data-signal]`,
		)?.style.setProperty('--route-length', `${length}px`)
		if (route !== 'return' || !label) return
		const { x, y } = loopLabelAt(from, to)
		label.setAttribute('x', String(x))
		label.setAttribute('y', String(y))
	})
	return lengths
}

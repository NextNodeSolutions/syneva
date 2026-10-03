// The circuit's wires are routed from the ports' live positions: ports
// include their responsive station transforms, and each signal references
// its wire through <use>, so the two can never disagree. Routes are measured
// once per layout (frame swap, fonts), never per animation frame.
const MIDPOINT = 0.5
const CLEARANCE = 44
const RADIUS = 16
const LABEL_GAP = 24
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

const connection = (from: DOMPoint, to: DOMPoint): string => {
	const middleX = (from.x + to.x) * MIDPOINT
	return `M${from.x} ${from.y}C${middleX} ${from.y} ${middleX} ${to.y} ${to.x} ${to.y}`
}

const returning = (from: DOMPoint, to: DOMPoint): string => {
	const bottom = Math.max(from.y, to.y) + CLEARANCE
	return `M${from.x} ${from.y}V${bottom - RADIUS}q0 ${RADIUS} ${-RADIUS} ${RADIUS}H${to.x + RADIUS}q${-RADIUS} 0 ${-RADIUS} ${-RADIUS}V${to.y}`
}

// Returns each route's length, keyed by the path id its signal travels.
export function routeCircuit(
	svg: SVGSVGElement,
	isCompact: boolean,
): Map<string, number> {
	svg.setAttribute('viewBox', isCompact ? COMPACT : WIDE)
	const lengths = new Map<string, number>()
	svg.querySelectorAll<SVGPathElement>('[data-from]').forEach(path => {
		const from = portPosition(svg, path.dataset.from ?? '')
		const to = portPosition(svg, path.dataset.to ?? '')
		path.setAttribute(
			'd',
			path.dataset.route === 'return'
				? returning(from, to)
				: connection(from, to),
		)
		const length = path.getTotalLength()
		lengths.set(path.id, length)
		svg.querySelector<SVGElement>(
			`[href="#${path.id}"][data-signal]`,
		)?.style.setProperty('--route-length', `${length}px`)
	})
	const route = svg.querySelector<SVGPathElement>('#flow-return')
	const label = svg.querySelector('[data-loop-label]')
	if (route && label) {
		const midpoint = route.getPointAtLength(
			route.getTotalLength() * MIDPOINT,
		)
		label.setAttribute('x', String(midpoint.x))
		label.setAttribute('y', String(midpoint.y + LABEL_GAP))
	}
	return lengths
}

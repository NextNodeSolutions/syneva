import { EASE } from '@syneva/motion/easing'

import { blink, loop, pixels } from './circuit-clock'
import { findPart, signalSelector } from './circuit-part'

import type { Easing } from '@syneva/motion/easing'
import type { loopTimeline } from '@syneva/motion/loop-timeline'
import type { SignalName } from './circuit-part'

// The three signals on the circuit's clock: each shows on its leg of the
// loop and travels its wire once. A signal's dash is its --signal-size.
const SIGNALS = [
	{ name: 'in', times: [0, 0.14, 0.15, 0.25, 0.26, 1], ease: EASE.review },
	{ name: 'out', times: [0, 0.47, 0.48, 0.63, 0.64, 1], ease: 'linear' },
	{ name: 'return', times: [0, 0.73, 0.74, 0.97, 0.98, 1], ease: 'linear' },
] as const satisfies readonly {
	name: SignalName
	times: number[]
	ease: Easing
}[]

const travel = (size: number, length: number): string[] => [
	`${size}px`,
	`${size}px`,
	`${size}px`,
	`${-length}px`,
	`${-length}px`,
	`${-length}px`,
]

const signalOf = (svg: SVGSVGElement, name: SignalName): Element =>
	findPart(svg, signalSelector(name), `signalPart('${name}')`)

// A signal's dash offsets over its timing: it travels its whole wire, as
// long as the live layout measured it. A signal on no routed wire would sit
// still at 0px.
function signalTravel(
	signal: Element,
	name: SignalName,
	lengths: Map<SignalName, number>,
): string[] {
	const length = lengths.get(name)
	if (!length)
		throw new Error(
			`The circuit's ${name} signal rides no wire routeCircuit() measured: give it a WIRES entry in circuit-layout.ts.`,
		)
	return travel(pixels(signal, '--signal-size'), length)
}

// The three signals travel their routes, measured from the live layout. A
// new layout retimes them (retimeLoop): the running signals keep their place
// on the clock and only their travel changes.
export function travelSignals(
	svg: SVGSVGElement,
	lengths: Map<SignalName, number>,
	run: typeof loopTimeline,
): void {
	SIGNALS.forEach(({ name, times, ease }) => {
		const signal = signalOf(svg, name)
		loop(
			signal,
			{
				opacity: blink(1),
				strokeDashoffset: signalTravel(signal, name, lengths),
			},
			{ times, ease },
			run,
		)
	})
}

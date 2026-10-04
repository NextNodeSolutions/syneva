import { EASE } from '@syneva/motion/easing'

import { blink, loop, pixels, valueAt } from './circuit-clock'
import { findPart, signalSelector } from './circuit-part'

import type { Easing } from '@syneva/motion/easing'
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

// A signal's dash offsets over its timing: it travels the whole wire it
// references, as long as the live layout measured it. A signal without a
// wire, or on a wire nothing routed, would sit still at 0px.
function signalTravel(
	signal: Element,
	name: SignalName,
	lengths: Map<string, number>,
): string[] {
	const wire = signal.getAttribute('href')?.slice(1)
	if (!wire)
		throw new Error(
			`The circuit's ${name} signal references no wire: give it href="#<wire id>".`,
		)
	const length = lengths.get(wire)
	if (!length)
		throw new Error(
			`The circuit's ${name} signal travels #${wire}, which routeCircuit() measured no length for: route it from WIRES in circuit-layout.ts.`,
		)
	return travel(pixels(signal, '--signal-size'), length)
}

// The three signals travel their routes, measured from the live layout.
export function travelSignals(
	svg: SVGSVGElement,
	lengths: Map<string, number>,
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
		)
	})
}

// A new layout re-measures the routes: the running signals keep their place
// on the clock and only their travel changes.
export function retimeSignals(
	svg: SVGSVGElement,
	lengths: Map<string, number>,
): void {
	SIGNALS.forEach(({ name }) => {
		const signal = signalOf(svg, name)
		const offsets = signalTravel(signal, name, lengths)
		signal.getAnimations().forEach(animation => {
			const { effect } = animation
			if (!(effect instanceof KeyframeEffect)) return
			const frames = effect.getKeyframes()
			if (!frames.some(frame => 'strokeDashoffset' in frame)) return
			effect.setKeyframes(
				frames.map((frame, index) =>
					Object.assign({}, frame, {
						strokeDashoffset: valueAt(
							offsets,
							index,
							'strokeDashoffset',
						),
					}),
				),
			)
		})
	})
}

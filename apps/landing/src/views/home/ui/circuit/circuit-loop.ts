import { EASE } from '@syneva/motion/easing'
import { loopTimeline } from '@syneva/motion/loop-timeline'

import { blink, hold, loop, pixels } from './circuit-clock'
import { circuitPartSelector, findPart, layerSelector } from './circuit-part'
import { travelSignals } from './circuit-signals'

import type { CircuitPart, LayerKind, SignalName } from './circuit-part'

const LAYERS = [
	{ kind: 'critical', rest: 0, delay: 0 },
	{ kind: 'important', rest: 10, delay: 0.06 },
	{ kind: 'tested', rest: 20, delay: 0.12 },
] as const satisfies readonly { kind: LayerKind; rest: number; delay: number }[]

type PartLookup = (name: CircuitPart) => Element

function unfold(svg: SVGSVGElement, part: PartLookup): void {
	loop(
		part('dispatch'),
		{ transform: hold('translateY(0px)', 'translateY(-9px)') },
		{ times: [0, 0.06, 0.12, 0.19, 0.25, 1], ease: EASE.review },
	)
	LAYERS.forEach(({ kind, rest, delay }) => {
		const layer = findPart(svg, layerSelector(kind), `layerPart('${kind}')`)
		const lift = pixels(layer, '--lift')
		loop(
			layer,
			{
				transform: hold(
					`translateY(${rest}px)`,
					`translateY(${lift}px)`,
				),
			},
			{ times: [0, 0.25, 0.31, 0.54, 0.59, 1], ease: EASE.unfold, delay },
		)
	})
	svg.querySelectorAll(circuitPartSelector('note')).forEach(note => {
		loop(
			note,
			{ opacity: blink(1) },
			{ times: [0, 0.28, 0.33, 0.49, 0.54, 1], ease: EASE.review },
		)
	})
}

function review(part: PartLookup): void {
	loop(
		part('focus'),
		{ opacity: blink(1), transform: hold('scale(1.07)', 'scale(1)') },
		{ times: [0, 0.31, 0.35, 0.48, 0.53, 1], ease: EASE.review },
	)
	loop(
		part('owner'),
		{ opacity: blink(1) },
		{ times: [0, 0.32, 0.36, 0.48, 0.52, 1], ease: EASE.review },
	)
	loop(
		part('sweep'),
		{
			opacity: blink(0.1),
			transform: [
				'translate(0px, 0px)',
				'translate(0px, 0px)',
				'translate(0px, 0px)',
				'translate(220px, 110px)',
				'translate(220px, 110px)',
				'translate(220px, 110px)',
			],
		},
		{ times: [0, 0.35, 0.37, 0.44, 0.46, 1], ease: EASE.review },
	)
	loop(
		part('accepted'),
		{ opacity: blink(1) },
		{ times: [0, 0.63, 0.69, 0.95, 0.99, 1], ease: EASE.review },
	)
	loop(
		part('seal'),
		{
			opacity: blink(1),
			transform: hold('translateY(-4px)', 'translateY(0px)'),
		},
		{ times: [0, 0.65, 0.73, 0.95, 0.99, 1], ease: EASE.review },
	)
}

export function playCircuit(
	svg: SVGSVGElement,
	lengths: Map<SignalName, number>,
): void {
	const part: PartLookup = name =>
		findPart(svg, circuitPartSelector(name), `circuitPart('${name}')`)
	unfold(svg, part)
	review(part)
	travelSignals(svg, lengths, loopTimeline)
}

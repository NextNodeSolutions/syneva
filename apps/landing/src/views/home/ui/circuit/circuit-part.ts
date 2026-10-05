import { partAttribute } from '@shared/lib/part-attribute'

// Every piece of the review circuit its runtime drives, named once: the
// markup marks a piece with circuitPart(), layerPart() or signalPart() and
// the loop and its signals select it by the same name, so a name only one
// side knows fails astro check.
export type CircuitPart =
	| 'dispatch'
	| 'note'
	| 'sweep'
	| 'focus'
	| 'owner'
	| 'accepted'
	| 'seal'
// The review layers, from the bottom of the stack up.
export type LayerKind = 'tested' | 'important' | 'critical'
// The travelling signals, by the leg of the loop they travel.
export type SignalName = 'in' | 'out' | 'return'

export const { mark: circuitPart, selector: circuitPartSelector } =
	partAttribute<CircuitPart>('data-circuit-part')
export const { mark: layerPart, selector: layerSelector } =
	partAttribute<LayerKind>('data-circuit-layer')
export const { mark: signalPart, selector: signalSelector } =
	partAttribute<SignalName>('data-signal')

// Every piece the runtime drives is in the markup: a missing one is a bug in
// Circuit.astro, not a piece to leave still.
export function findPart(
	svg: SVGSVGElement,
	selector: string,
	mark: string,
): Element {
	const found = svg.querySelector(selector)
	if (!found)
		throw new Error(
			`The review circuit has no ${selector}: mark it with ${mark}.`,
		)
	return found
}

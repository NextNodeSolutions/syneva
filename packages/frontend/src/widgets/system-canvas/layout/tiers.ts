import type {
	ModelElement,
	ModelElementKind,
} from '@entities/review/guide/system-model'

// Where an element sits in the architecture, read from its kind alone (the agent's model names no tier): what people use on the top floor, what serves it in the middle, what keeps the data at the bottom. People and the systems outside stand on the rim, beside the floor they talk to: the people on the left, where a request comes in, the other systems on the right.

export type Tier = 'interface' | 'service' | 'data'
export type Place = Tier | 'people' | 'outside'

const PLACES: Record<ModelElementKind, Place> = {
	actor: 'people',
	external: 'outside',
	// A system with no parts drawn is another system; one that holds parts is a container, and its parts take their own floors.
	system: 'outside',
	ui: 'interface',
	service: 'service',
	component: 'service',
	store: 'data',
	queue: 'data',
}

// The floors bottom up, each with the name its plaque carries.
export const FLOORS: readonly { tier: Tier; name: string }[] = [
	{ tier: 'data', name: 'Data' },
	{ tier: 'service', name: 'Services' },
	{ tier: 'interface', name: 'Interface' },
]

export function placeOf(element: ModelElement): Place {
	return PLACES[element.kind]
}

export function isTier(place: Place): place is Tier {
	return place !== 'people' && place !== 'outside'
}

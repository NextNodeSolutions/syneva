import { readProperty } from './read-property'

import type { Channel, ContentName, Values } from './navigation-channels'

type Reveal = {
	channels: readonly Channel<ContentName>[]
	// The clock's current target, which says what is shown now.
	target: Values
	selected: number
	travel: number
	styles: CSSStyleDeclaration
}

// The selected channel comes in and the others go, sliding by `travel` px in
// the direction of the move. One entering from fully hidden is seeded on the
// far side, so it slides in rather than from wherever it last rested.
export function revealChannels({
	channels,
	target,
	selected,
	travel,
	styles,
}: Reveal): { next: Values; seeds: Values } {
	const previous = channels.findIndex(
		channel => target[channel.property('progress')] === '1',
	)
	const direction = selected < previous ? -1 : 1
	const next: Values = {}
	const seeds: Values = {}
	channels.forEach((channel, index) => {
		const isSelected = index === selected
		Object.assign(
			next,
			channel.values({
				progress: isSelected ? 1 : 0,
				opacity: isSelected ? 1 : 0,
				offset: isSelected ? 0 : -direction * travel,
			}),
		)
		const progress = readProperty(styles, channel.property('progress'))
		if (isSelected && Number(progress) === 0)
			seeds[channel.property('offset')] = String(direction * travel)
	})
	return { next, seeds }
}

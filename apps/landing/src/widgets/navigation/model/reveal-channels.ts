import { readProperty } from './computed-style'
import { channelValues } from './navigation-channels'

import type { Channel, Values } from './navigation-channels'

type Reveal = {
	channels: readonly Channel[]
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
		channel => target[channel.progress ?? ''] === '1',
	)
	const direction = selected < previous ? -1 : 1
	const next: Values = {}
	const seeds: Values = {}
	channels.forEach((channel, index) => {
		const isSelected = index === selected
		Object.assign(
			next,
			channelValues(channel, {
				progress: isSelected ? 1 : 0,
				opacity: isSelected ? 1 : 0,
				offset: isSelected ? 0 : -direction * travel,
			}),
		)
		if (
			isSelected &&
			Number(readProperty(styles, channel.progress ?? '')) === 0
		)
			seeds[channel.offset ?? ''] = String(direction * travel)
	})
	return { next, seeds }
}

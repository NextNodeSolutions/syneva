import type { Channel, ChannelValues, ContentName } from './navigation-channels'

export type HandoverFrames = Map<string, { values: string[]; times: number[] }>

// Readable content hands over instead of superimposing two menus: within a
// channel group, an outgoing panel fades out by EXIT_AT of the move while
// the incoming one holds, then fades in by ENTER_AT.
const EXIT_AT = 0.22
const ENTER_AT = 0.7

// Both snapshots carry every channel: a missing one is a bug in the
// registry, not a value to guess.
function valueOf(values: ChannelValues, name: string): string {
	const channelValue = values[name]
	if (channelValue === undefined)
		throw new Error(
			`The menu snapshot has no ${name}: register the channel before the morph reads it.`,
		)
	return channelValue
}

// One frame list per channel on the shared clock.
export function handoverFrames(
	origin: ChannelValues,
	destination: ChannelValues,
	groups: readonly Channel<ContentName>[][],
): HandoverFrames {
	const frames = new Map(
		Object.keys(destination).map(key => [
			key,
			{
				values: [valueOf(origin, key), valueOf(destination, key)],
				times: [0, 1],
			},
		]),
	)
	for (const channels of groups) {
		const incoming = channels.find(
			channel => destination[channel.property('progress')] === '1',
		)
		const outgoing = channels.filter(
			channel =>
				channel !== incoming &&
				Number(origin[channel.property('opacity')]) > 0,
		)
		if (!incoming || !outgoing.length) continue
		outgoing.forEach(channel => {
			const name = channel.property('opacity')
			frames.set(name, {
				values: [
					valueOf(origin, name),
					'0',
					valueOf(destination, name),
				],
				times: [0, EXIT_AT, 1],
			})
		})
		const name = incoming.property('opacity')
		const from = valueOf(origin, name)
		const to = valueOf(destination, name)
		frames.set(name, {
			values: [from, from, to, to],
			times: [0, EXIT_AT, ENTER_AT, 1],
		})
	}
	return frames
}

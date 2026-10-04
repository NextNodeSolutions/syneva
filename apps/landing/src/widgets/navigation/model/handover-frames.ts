import type { Channel, Values } from './navigation-channels'

export type Frames = Map<string, { values: string[]; times: number[] }>

// Readable content hands over instead of superimposing two menus: within a
// channel group, an outgoing panel fades out by EXIT_AT of the move while
// the incoming one holds, then fades in by ENTER_AT.
const EXIT_AT = 0.22
const ENTER_AT = 0.7

// One frame list per channel on the shared clock.
export function contentFrames(
	origin: Values,
	destination: Values,
	groups: readonly Channel[][],
): Frames {
	const frames = new Map(
		Object.keys(destination).map(key => [
			key,
			{
				values: [origin[key] ?? '', destination[key] ?? ''],
				times: [0, 1],
			},
		]),
	)
	for (const channels of groups) {
		const incoming = channels.find(
			channel => destination[channel.progress ?? ''] === '1',
		)
		const outgoing = channels.filter(
			channel =>
				channel !== incoming &&
				Number(origin[channel.opacity ?? '']) > 0,
		)
		if (!incoming?.opacity || !outgoing.length) continue
		outgoing.forEach(channel => {
			const name = channel.opacity ?? ''
			frames.set(name, {
				values: [origin[name] ?? '', '0', destination[name] ?? ''],
				times: [0, EXIT_AT, 1],
			})
		})
		const name = incoming.opacity
		const from = origin[name] ?? ''
		const to = destination[name] ?? ''
		frames.set(name, {
			values: [from, from, to, to],
			times: [0, EXIT_AT, ENTER_AT, 1],
		})
	}
	return frames
}

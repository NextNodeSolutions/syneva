// The morph's channels: every value it animates is a registered <number>
// custom property on the navigation, aliased to the plain name the
// stylesheet reads (--x, --reveal, --progress, ...).
export const GEOMETRY = [
	'x',
	'y',
	'width',
	'height',
	'reveal',
	'indicator-x',
	'indicator-width',
	'selection-y',
	'selection-height',
]
export const CONTENT = ['progress', 'offset', 'opacity']
// Readable content hands over instead of superimposing two menus: the
// outgoing panel is gone by 22% of the move, the incoming one in by 70%.
export const EXIT_AT = 0.22
export const ENTER_AT = 0.7
const MS_PER_S = 1000

export type Channel = Record<string, string>
export type Values = Record<string, string>
export type Frames = Map<string, { values: string[]; times: number[] }>

// Registered <number> channels are what let the Web Animations API
// interpolate the morph. Without CSS.registerProperty the values still carry
// (var() aliases inherit unregistered), but every move becomes a jump.
export const canInterpolate =
	typeof CSS !== 'undefined' && typeof CSS.registerProperty === 'function'

export function registerChannel(
	element: HTMLElement,
	prefix: string,
	properties: string[],
): Channel {
	return Object.fromEntries(
		properties.map(property => {
			const name = `--nav-${prefix}${property}`
			if (canInterpolate)
				CSS.registerProperty({
					name,
					syntax: '<number>',
					inherits: true,
					initialValue: '0',
				})
			element.style.setProperty(`--${property}`, `var(${name})`)
			return [property, name]
		}),
	)
}

export function channelValues(
	channel: Channel,
	values: Record<string, number>,
): Values {
	return Object.fromEntries(
		Object.entries(values).map(([key, entry]) => [
			channel[key] ?? key,
			String(entry),
		]),
	)
}

export const read = (styles: CSSStyleDeclaration, name: string): string =>
	styles.getPropertyValue(name).trim()

// The clock is written in ms but the CSS minifier may print it in seconds
// (240ms becomes .24s), so the unit decides the scale.
export function seconds(time: string): number {
	const amount = Number.parseFloat(time)
	return time.endsWith('ms') ? amount / MS_PER_S : amount
}

// One frame list per channel on the shared clock. Readable content hands
// over instead of superimposing two menus: per channel group, an outgoing
// panel fades by EXIT_AT while the incoming one holds, then fades in by
// ENTER_AT.
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

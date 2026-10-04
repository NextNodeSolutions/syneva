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

export type Channel = Record<string, string>
export type Values = Record<string, string>

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

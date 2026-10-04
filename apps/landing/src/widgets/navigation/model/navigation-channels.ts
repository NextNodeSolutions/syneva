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
] as const
export const CONTENT = ['progress', 'offset', 'opacity'] as const

export type GeometryName = (typeof GEOMETRY)[number]
export type ContentName = (typeof CONTENT)[number]
export type Values = Record<string, string>

// One element's channels: the registered property behind each name, and
// values keyed by name, renamed to those properties.
export type Channel<Name extends string> = {
	property: (name: Name) => string
	values: (values: Partial<Record<Name, number>>) => Values
}

// Registered <number> channels are what let the Web Animations API
// interpolate the morph. Without CSS.registerProperty the values still carry
// (var() aliases inherit unregistered), but every move becomes a jump.
export const canInterpolate =
	typeof CSS !== 'undefined' && typeof CSS.registerProperty === 'function'

export function registerChannel<Name extends string>(
	element: HTMLElement,
	prefix: string,
	names: readonly Name[],
): Channel<Name> {
	const property = (name: string): string => `--nav-${prefix}${name}`
	for (const name of names) {
		if (canInterpolate)
			CSS.registerProperty({
				name: property(name),
				syntax: '<number>',
				inherits: true,
				initialValue: '0',
			})
		element.style.setProperty(`--${name}`, `var(${property(name)})`)
	}
	return {
		property,
		values: values =>
			Object.fromEntries(
				Object.entries(values).flatMap(([name, value]) =>
					typeof value === 'number'
						? [[property(name), String(value)]]
						: [],
				),
			),
	}
}

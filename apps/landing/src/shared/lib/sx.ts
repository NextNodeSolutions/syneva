import * as stylex from '@stylexjs/stylex'

import type { CompiledStyles, StyleXArray } from '@stylexjs/stylex'

// Whatever stylex.props() takes: compiled styles (markers included), falsy
// entries (conditional styles) and nested arrays of them.
export type Style = StyleXArray<CompiledStyles | boolean | null | undefined>
// A plain string is a state class the client toggles (is-current, is-previewed):
// it rides along with the StyleX classes so the server-rendered state matches.
export type Part = Style | string
export type Attributes = { class?: string; style?: string }

const kebab = (name: string): string =>
	name.startsWith('--')
		? name
		: name.replaceAll(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)

// stylex.props() for Astro markup: `class` instead of className, and inline
// styles (custom properties, mostly) serialised the way an attribute expects.
export function sx(...parts: Part[]): Attributes {
	const states = parts.filter(
		(part): part is string => typeof part === 'string',
	)
	const styles = parts.filter(
		(part): part is Exclude<Part, string> => typeof part !== 'string',
	)
	const { className, style } = stylex.props(...styles)
	const names = [className, ...states].filter(Boolean).join(' ')
	const inline = Object.entries(style ?? {})
		.map(([name, entry]) => `${kebab(name)}:${String(entry)}`)
		.join(';')
	const attributes: Attributes = {}
	if (names) attributes.class = names
	if (inline) attributes.style = inline
	return attributes
}

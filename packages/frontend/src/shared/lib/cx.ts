import * as stylex from '@stylexjs/stylex'

import type {
	CompiledStyles,
	InlineStyles,
	StyleXArray,
} from '@stylexjs/stylex'

// Whatever cx() takes: compiled static styles (markers and themes included),
// falsy entries (conditional styles) and nested arrays of them.
export type StaticStyle = StyleXArray<
	CompiledStyles | boolean | null | undefined
>
// Whatever stylex.props() takes in the React chrome: the static styles plus
// the [classes, inline variables] pair a dynamic style function returns.
export type Style = StyleXArray<
	| CompiledStyles
	| boolean
	| null
	| undefined
	| Readonly<[CompiledStyles, InlineStyles]>
>

// stylex.props() for the DOM the desk builds outside React (the diff island's
// headers, threads and cards): the class string an element carries, for
// `el.className = cx(...)` or a `class="${cx(...)}"` in a template. Static
// styles only - a dynamic style's inline variables would be dropped, so a value
// computed at runtime is a custom property the element sets itself.
export function cx(...styles: StaticStyle[]): string {
	return stylex.props(...styles).className ?? ''
}

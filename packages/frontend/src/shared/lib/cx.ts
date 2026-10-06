import * as stylex from '@stylexjs/stylex'

import type {
	CompiledStyles,
	InlineStyles,
	StyleXArray,
} from '@stylexjs/stylex'

export type StaticStyle = StyleXArray<
	CompiledStyles | boolean | null | undefined
>
export type Style = StyleXArray<
	| CompiledStyles
	| boolean
	| null
	| undefined
	| Readonly<[CompiledStyles, InlineStyles]>
>

// Static styles only - a dynamic style's inline variables are dropped here, so a value computed at runtime is a custom property the element sets itself.
export function cx(...styles: StaticStyle[]): string {
	return stylex.props(...styles).className ?? ''
}

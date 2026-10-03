import type { animate } from './animate'

// animate()'s options, plus the pseudo-element target: Motion forwards
// pseudoElement to the Web Animations API (its NativeAnimation reads it),
// but the options type does not declare it.
type Arguments = Parameters<typeof animate>
export type AnimateOptions = NonNullable<
	Arguments extends [unknown, unknown, (infer Options)?, ...unknown[]]
		? Options
		: never
> & {
	pseudoElement?: string
}

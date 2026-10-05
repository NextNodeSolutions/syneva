import type { color } from '@syneva/design-system/tokens.stylex'

// The hero timeline's colours. Keyframe values are resolved without custom
// properties, so they are read once from the design system's tokens.
type ColorToken = Extract<keyof typeof color, `--${string}`>

export type Palette = Record<
	| 'white'
	| 'mint'
	| 'paleMint'
	| 'green'
	| 'strong'
	| 'muted'
	| 'accent'
	| 'accentDeep',
	string
>

export function palette(): Palette {
	const tokens = getComputedStyle(document.documentElement)
	const token = (name: ColorToken): string =>
		tokens.getPropertyValue(name).trim()
	return {
		white: token('--white'),
		mint: token('--mint'),
		paleMint: token('--mint-pale'),
		green: token('--green'),
		strong: token('--line-strong'),
		muted: token('--muted'),
		accent: token('--accent'),
		accentDeep: token('--accent-deep'),
	}
}

import * as stylex from '@stylexjs/stylex'
import { control } from '@syneva/design-system/controls.styles'
import { controlMarker } from '@syneva/design-system/controls.stylex'
import { press } from '@syneva/design-system/press.styles'

import type { Style } from '@shared/lib/cx'

// How a button (or a link dressed as one) looks, apart from the native
// attributes it forwards untouched: the recipe's tone and size, an arrow that
// steps forward on hover, an icon-only square, a row-filling block, a key
// hint, and a busy state that swaps the label while its action runs. `css`
// merges last, so a caller's layout wins over the recipe.
export type ButtonLook = {
	tone?: 'primary' | 'outlined' | 'quiet' | 'danger' | undefined
	size?: 'small' | 'large' | undefined
	arrow?: boolean | undefined
	square?: boolean | undefined
	block?: boolean | undefined
	kbd?: string | undefined
	busy?: boolean | undefined
	busyLabel?: string | undefined
	css?: Style | undefined
}

type LookProps = ReturnType<typeof stylex.props>

// Button and ButtonLink take the look flat beside the native attributes;
// this parts them, so only the native ones reach the element.
export function splitLook<T extends ButtonLook>({
	tone,
	size,
	arrow,
	square,
	block,
	kbd,
	busy,
	busyLabel,
	css,
	...native
}: T): { look: ButtonLook; native: Omit<T, keyof ButtonLook> } {
	return {
		look: {
			tone,
			size,
			arrow,
			square,
			block,
			kbd,
			busy,
			busyLabel,
			css,
		},
		native,
	}
}

// The look's class names. An outlined tile is the default: the site's header
// action, the one a surface can repeat without shouting.
export function lookProps(look: ButtonLook): LookProps {
	return stylex.props(
		press.control,
		control.base,
		control[look.tone ?? 'outlined'],
		look.size && control[look.size],
		look.square === true && control.square,
		look.block === true && control.block,
		look.arrow === true && controlMarker,
		look.css,
	)
}

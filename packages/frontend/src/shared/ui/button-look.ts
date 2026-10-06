import * as stylex from '@stylexjs/stylex'
import { control } from '@syneva/design-system/controls.styles'
import { controlMarker } from '@syneva/design-system/controls.stylex'
import { press } from '@syneva/design-system/press.styles'

import type { Style } from '@shared/lib/cx'

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

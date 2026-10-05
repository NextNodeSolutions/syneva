import * as stylex from '@stylexjs/stylex'
import { kbd } from '@syneva/design-system/inline.styles'

import type { Style } from '@shared/lib/cx'
import type { ComponentPropsWithRef, ReactElement } from 'react'

type KbdProps = Omit<
	ComponentPropsWithRef<'kbd'>,
	'className' | 'style' | 'children'
> & {
	keys: string
	css?: Style | undefined
}

// A key hint: the key a shortcut answers to, set as a small keycap. A cap on a
// solid or tinted control passes kbd.onFill / kbd.onTint through `css`.
export function Kbd({ keys, css, ...native }: KbdProps): ReactElement {
	return (
		<kbd {...native} {...stylex.props(kbd.base, css)}>
			{keys}
		</kbd>
	)
}

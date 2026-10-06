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

export function Kbd({ keys, css, ...native }: KbdProps): ReactElement {
	return (
		<kbd {...native} {...stylex.props(kbd.base, css)}>
			{keys}
		</kbd>
	)
}

import * as stylex from '@stylexjs/stylex'
import { focus } from '@syneva/design-system/controls.styles'
import { textLink } from '@syneva/design-system/inline.styles'

import { textButton } from './text-button.styles'

import type { Style } from '@shared/lib/cx'
import type { ComponentPropsWithRef, ReactElement } from 'react'

type TextButtonProps = {
	small?: boolean | undefined
	css?: Style | undefined
} & Omit<ComponentPropsWithRef<'button'>, 'className' | 'style'>

export function TextButton({
	small,
	css,
	type = 'button',
	...native
}: TextButtonProps): ReactElement {
	return (
		<button
			type={type}
			{...native}
			{...stylex.props(
				focus.ring,
				textLink.base,
				small === true && textLink.small,
				textButton.base,
				css,
			)}
		/>
	)
}

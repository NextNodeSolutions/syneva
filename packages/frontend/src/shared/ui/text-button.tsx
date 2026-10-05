import * as stylex from '@stylexjs/stylex'
import { focus } from '@syneva/design-system/controls.styles'
import { textLink } from '@syneva/design-system/inline.styles'

import { textButton } from './text-button.styles'

import type { Style } from '@shared/lib/cx'
import type { ComponentPropsWithRef, ReactElement } from 'react'

type TextButtonProps = {
	// A step smaller, beside small controls (a row's Close and Keep).
	small?: boolean | undefined
	// Merged last: the caller's height and inset.
	css?: Style | undefined
} & Omit<ComponentPropsWithRef<'button'>, 'className' | 'style'>

// An action that reads as the secondary text link, for a step that is a button rather than a
// navigation: Close on a row, Keep beside Close desk, Cancel beside a dialog's primary. The
// site's secondary action is that underlined link, never a ghost button. It defaults to
// type="button", so only a form's declared submit submits.
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

import { buttonMarker } from '@shared/ui/actions.stylex'
import { button } from '@shared/ui/button.styles'
import * as stylex from '@stylexjs/stylex'
import {
	MARK_DIAMOND,
	MARK_RAYS,
	MARK_VIEW_BOX,
} from '@syneva/design-system/brand'
import { ARROW_PATH, ARROW_VIEW_BOX } from '@syneva/design-system/icons'
import { press } from '@syneva/design-system/press.styles'

import { reset } from './reset.styles'
import { sendButton } from './send-button.styles'

import type { StyleXStyles } from '@stylexjs/stylex'
import type { ReactElement, ReactNode } from 'react'

type SendButtonProps = {
	isSending: boolean
	// The size of the place it sits in, over the site's primary button.
	css?: StyleXStyles
	children: ReactNode
}

// The site's primary button as a submit. It stays enabled while it sends (the form ignores a second press): a disabled button would drop the keyboard focus.
export function SendButton({
	isSending,
	css,
	children,
}: SendButtonProps): ReactElement {
	return (
		<button
			{...stylex.props(
				press.control,
				reset.border,
				button.base,
				button.primary,
				sendButton.native,
				css,
				buttonMarker,
			)}
			type="submit"
			aria-disabled={isSending || undefined}
		>
			{children}
			{isSending ? (
				<svg
					{...stylex.props(button.arrow, sendButton.turning)}
					viewBox={MARK_VIEW_BOX}
					aria-hidden="true"
				>
					<path d={MARK_RAYS} />
					<path d={MARK_DIAMOND} />
				</svg>
			) : (
				<svg
					{...stylex.props(button.arrow)}
					viewBox={ARROW_VIEW_BOX}
					aria-hidden="true"
				>
					<path d={ARROW_PATH} />
				</svg>
			)}
		</button>
	)
}

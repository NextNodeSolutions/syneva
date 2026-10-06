import * as stylex from '@stylexjs/stylex'
import {
	MARK_DIAMOND,
	MARK_RAYS,
	MARK_VIEW_BOX,
} from '@syneva/design-system/brand'
import { ARROW_PATH, ARROW_VIEW_BOX } from '@syneva/design-system/icons'
import { press } from '@syneva/design-system/press.styles'

import { sendButton } from './send-button.styles'
import { sendMarker } from './signup.stylex'

import type { StyleXStyles } from '@stylexjs/stylex'
import type { ReactElement, ReactNode } from 'react'

type SendButtonProps = {
	isSending: boolean
	// The size and spacing of the place it sits in.
	css: StyleXStyles
	children: ReactNode
}

// Stays enabled while it sends (the form ignores a second press): a disabled button would drop the keyboard focus.
export function SendButton({
	isSending,
	css,
	children,
}: SendButtonProps): ReactElement {
	return (
		<button
			{...stylex.props(press.control, sendButton.base, css, sendMarker)}
			type="submit"
			aria-disabled={isSending || undefined}
		>
			{children}
			{isSending ? (
				<svg
					{...stylex.props(sendButton.icon, sendButton.turning)}
					viewBox={MARK_VIEW_BOX}
					aria-hidden="true"
				>
					<path d={MARK_RAYS} />
					<path d={MARK_DIAMOND} />
				</svg>
			) : (
				<svg
					{...stylex.props(sendButton.icon, sendButton.arrow)}
					viewBox={ARROW_VIEW_BOX}
					aria-hidden="true"
				>
					<path d={ARROW_PATH} />
				</svg>
			)}
		</button>
	)
}

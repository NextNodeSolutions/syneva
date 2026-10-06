import * as stylex from '@stylexjs/stylex'
import { ARROW_VIEW_BOX, CHECK_PATH } from '@syneva/design-system/icons'
import { textButton, textLink } from '@syneva/design-system/inline.styles'

import { LIST_PROMISE } from '../model/list'
import { useFocusOnMount } from '../model/use-focus-on-mount'

import { fieldText } from './field.styles'
import { quickSignup } from './quick-signup.styles'

import type { ReactElement } from 'react'
import type { Signup } from '../model/signup'

type QuickJoinedProps = {
	signup: Signup
	hasFocus: boolean
	onLeave: () => void
}

// The hero's box once the address is in: the verdict in green, in the place the address was typed.
export function QuickJoined({
	signup,
	hasFocus,
	onLeave,
}: QuickJoinedProps): ReactElement {
	const focusOnMount = useFocusOnMount<HTMLParagraphElement>(hasFocus)
	return (
		<div>
			<p
				ref={focusOnMount}
				{...stylex.props(quickSignup.joined)}
				tabIndex={-1}
			>
				<svg
					{...stylex.props(quickSignup.check)}
					viewBox={ARROW_VIEW_BOX}
					aria-hidden="true"
				>
					<path d={CHECK_PATH} />
				</svg>
				<span {...stylex.props(quickSignup.verdict)}>On the list</span>
				<span {...stylex.props(quickSignup.address)}>
					{signup.email}
				</span>
			</p>
			<p {...stylex.props(fieldText.status)}>
				{LIST_PROMISE}
				<button
					{...stylex.props(
						textLink.base,
						textLink.small,
						textButton.base,
					)}
					type="button"
					onClick={onLeave}
				>
					Use another address
				</button>
			</p>
		</div>
	)
}

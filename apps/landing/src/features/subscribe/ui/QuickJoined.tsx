import { useCallback } from 'react'

import * as stylex from '@stylexjs/stylex'

import { quickSignup } from './quick-signup.styles'

import type { ReactElement } from 'react'
import type { Signup } from '../model/signup'

type QuickJoinedProps = {
	signup: Signup
	promise: string
	hasFocus: boolean
	onLeave: () => void
}

// The hero's box once the address is in: the verdict in green, in the place the address was typed.
export function QuickJoined({
	signup,
	promise,
	hasFocus,
	onLeave,
}: QuickJoinedProps): ReactElement {
	const focusOnMount = useCallback(
		(box: HTMLParagraphElement | null) => {
			if (hasFocus) box?.focus()
		},
		[hasFocus],
	)
	return (
		<div>
			<p
				ref={focusOnMount}
				{...stylex.props(quickSignup.joined)}
				tabIndex={-1}
			>
				<svg
					{...stylex.props(quickSignup.check)}
					viewBox="0 0 20 20"
					aria-hidden="true"
				>
					<path d="m4 10.5 4 4 8-9" />
				</svg>
				<span {...stylex.props(quickSignup.verdict)}>On the list</span>
				<span {...stylex.props(quickSignup.address)}>
					{signup.email}
				</span>
			</p>
			<p {...stylex.props(quickSignup.note)}>
				{promise}
				<button
					{...stylex.props(quickSignup.leave)}
					type="button"
					onClick={onLeave}
				>
					Use another address
				</button>
			</p>
		</div>
	)
}

import * as stylex from '@stylexjs/stylex'

import { covers } from './desk-covers.styles'

import type { ReactElement } from 'react'

// This browser's sign-in no longer opens the hub: the review cannot be read or saved until it signs
// in again. The link is the desk's own page: the hub answers a page it is not signed in for with
// its sign-in form, which brings the reviewer back here.
export function SignedOutCover(): ReactElement {
	return (
		<div {...stylex.props(covers.cover)} role="status">
			<div {...stylex.props(covers.card)}>
				<h2 {...stylex.props(covers.title)}>Sign in again.</h2>
				<p {...stylex.props(covers.paragraph)}>
					This browser&apos;s sign-in no longer opens the hub: its key
					changed, or the sign-in ended. This tab stopped following
					the desk.
				</p>
				<p {...stylex.props(covers.paragraph)}>
					<a
						{...stylex.props(covers.link)}
						href={window.location.pathname}
					>
						Sign in
					</a>{' '}
					to come back to this desk.
				</p>
			</div>
		</div>
	)
}

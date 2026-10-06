import * as stylex from '@stylexjs/stylex'

import { quickSignup } from './quick-signup.styles'

import type { ReactElement } from 'react'

type QuickNoteProps = {
	id: string
	promise: string
	// What stopped the form, in place of the promise.
	refusal: string | undefined
	// The round trip under way, also in its place.
	progress: string | undefined
}

// The line under the hero's box, held open so the hero never shifts: the list's promise, the send under way, or what stopped it.
export function QuickNote({
	id,
	promise,
	refusal,
	progress,
}: QuickNoteProps): ReactElement {
	return (
		<p
			{...stylex.props(
				quickSignup.note,
				Boolean(refusal) && quickSignup.noteRefused,
			)}
			id={id}
			role="status"
		>
			{Boolean(refusal) && (
				<span
					{...stylex.props(quickSignup.noteSquare)}
					aria-hidden="true"
				/>
			)}
			{refusal ?? progress ?? promise}
		</p>
	)
}

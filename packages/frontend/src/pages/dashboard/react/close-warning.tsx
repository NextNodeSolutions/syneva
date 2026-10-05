import { LiveDot } from '@shared/ui/live-dot'
import * as stylex from '@stylexjs/stylex'

import { deskReview } from './desk-review.styles'

import type { ReactElement } from 'react'

// What an armed close is about to do, in the review's place. The hub tells the agent only if
// one is listening (a parked await takes the event; the desk's queue goes with the desk), so
// that is said only then; the review stays saved either way. Close desk and Keep point at it
// (aria-describedby).
export function CloseWarning({
	id,
	isAgentListening,
}: {
	id: string
	isAgentListening: boolean
}): ReactElement {
	return (
		<p id={id} {...stylex.props(deskReview.cell, deskReview.warning)}>
			<LiveDot tone="red" css={deskReview.warningDot} />
			<span>
				{isAgentListening
					? 'Close this desk? Your agent is told the review ended.'
					: 'Close this desk? Its review stays saved.'}
			</span>
		</p>
	)
}

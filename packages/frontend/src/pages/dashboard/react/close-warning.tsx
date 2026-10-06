import { LiveDot } from '@shared/ui/live-dot'
import * as stylex from '@stylexjs/stylex'

import { deskReview } from './desk-review.styles'
import { deskSlide } from './desk-slide.styles'

import type { ReactElement } from 'react'

export function CloseWarning({
	id,
	isAgentListening,
}: {
	id: string
	isAgentListening: boolean
}): ReactElement {
	return (
		<p
			id={id}
			{...stylex.props(
				deskReview.cell,
				deskReview.warning,
				deskSlide.part,
			)}
		>
			<LiveDot tone="red" css={deskReview.warningDot} />
			<span>
				{isAgentListening
					? 'Close this desk? Your agent is told the review ended.'
					: 'Close this desk? Its review stays saved.'}
			</span>
		</p>
	)
}

import { TextButton } from '@shared/ui/text-button'
import { touchTarget } from '@shared/ui/touch-target.styles'
import * as stylex from '@stylexjs/stylex'

import { closeControl } from './close-control.styles'
import { ConfirmClose } from './confirm-close'

import type { ReactElement } from 'react'
import type { CloseActions, CloseState } from '../use-desk-close'

type CloseControlProps = {
	session: string
	state: CloseState
	ids: { close: string; keep: string; warning: string }
	actions: CloseActions
}

// Close ends the review for the agent, so the first click arms it and only a second,
// deliberate one confirms. At rest it is the site's secondary action, an underlined text link,
// never hidden until hover. Armed, Close desk comes first and Keep lands where Close was, so a
// double click meant for Close hits Keep; focus moves to Keep, the least destructive choice, so
// a held Enter never confirms. Escape and focus leaving the pair disarm it. Focus is placed by
// the owner once the pair or Close is on screen (ids.keep, ids.close).
export function CloseControl({
	session,
	state,
	ids,
	actions,
}: CloseControlProps): ReactElement {
	if (state !== 'rest')
		return (
			<ConfirmClose
				session={session}
				isClosing={state === 'closing'}
				ids={ids}
				actions={actions}
			/>
		)
	return (
		<div {...stylex.props(closeControl.cell)}>
			<TextButton
				id={ids.close}
				small
				css={touchTarget.small}
				aria-label={`Close desk ${session}`}
				onClick={actions.arm}
			>
				Close
			</TextButton>
		</div>
	)
}

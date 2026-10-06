import { TextButton } from '@shared/ui/text-button'
import { touchTarget } from '@shared/ui/touch-target.styles'
import * as stylex from '@stylexjs/stylex'

import { deskCloseId, deskKeepId } from '../focus-targets'

import { closeControl } from './close-control.styles'
import { ConfirmClose } from './confirm-close'

import type { HubDesk } from '@entities/hub/model'
import type { ReactElement } from 'react'
import type { RowClose } from '../use-desk-close'

type CloseControlProps = {
	desk: Pick<HubDesk, 'id' | 'session'>
	close: RowClose
	// The armed warning, which describes Close desk and Keep.
	warningId: string
}

// Close ends the review for the agent, so the first click arms it and only a second,
// deliberate one confirms. At rest it is the site's secondary action, an underlined text link,
// never hidden until hover. Armed, Close desk comes first, then Keep; the second click of a
// double click meant for Close never confirms (confirm-close.tsx), and focus moves to Keep, the
// least destructive choice, so a held Enter never confirms. Escape and focus leaving the pair
// disarm it. Focus is placed by the owner once the pair or Close is on screen (deskKeepId,
// deskCloseId).
export function CloseControl({
	desk,
	close,
	warningId,
}: CloseControlProps): ReactElement {
	if (close.state !== 'rest')
		return (
			<ConfirmClose
				session={desk.session}
				isClosing={close.state === 'closing'}
				ids={{ keep: deskKeepId(desk.id), warning: warningId }}
				actions={close.actions}
			/>
		)
	return (
		<div {...stylex.props(closeControl.cell)}>
			<TextButton
				id={deskCloseId(desk.id)}
				small
				css={[touchTarget.small, closeControl.quiet]}
				aria-label={`Close desk ${desk.session}`}
				onClick={close.actions.arm}
			>
				Close
			</TextButton>
		</div>
	)
}

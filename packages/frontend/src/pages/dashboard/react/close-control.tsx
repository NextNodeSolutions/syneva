import { TextButton } from '@shared/ui/text-button'
import { touchTarget } from '@shared/ui/touch-target.styles'
import * as stylex from '@stylexjs/stylex'

import { deskCloseId, deskKeepId } from '../focus-targets'
import { isHubOffline } from '../hub-copy'

import { closeControl } from './close-control.styles'
import { ConfirmClose } from './confirm-close'

import type { HubDesk } from '@entities/hub/model'
import type { ReactElement } from 'react'
import type { RowClose } from '../use-desk-close'

type CloseControlProps = {
	desk: Pick<HubDesk, 'id' | 'session' | 'hub'>
	close: RowClose
	// The armed warning, which describes Close desk and Keep.
	warningId: string
}

// The first click arms, a second deliberate one confirms; armed, Keep lands where Close was so a double click meant for Close hits Keep, and focus moves to Keep - the least destructive choice.
// So a held Enter never confirms; Escape and focus leaving the pair disarm it.
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
				css={[
					touchTarget.small,
					closeControl.quiet,
					isHubOffline(desk) && closeControl.unavailable,
				]}
				aria-label={`Close desk ${desk.session}`}
				// Closing relays to the desk's hub, which an offline one cannot answer.
				disabled={isHubOffline(desk)}
				title={
					isHubOffline(desk)
						? 'Its hub is offline: bring it back to close this desk.'
						: undefined
				}
				onClick={close.actions.arm}
			>
				Close
			</TextButton>
		</div>
	)
}

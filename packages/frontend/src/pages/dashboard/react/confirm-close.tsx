import { focusLeave } from '@shared/lib/focus-leave'
import { Button } from '@shared/ui/button'
import { TextButton } from '@shared/ui/text-button'
import { touchTarget } from '@shared/ui/touch-target.styles'
import * as stylex from '@stylexjs/stylex'

import { closeControl } from './close-control.styles'

import type { ReactElement } from 'react'
import type { CloseActions } from '../use-desk-close'

type ConfirmCloseProps = {
	session: string
	isClosing: boolean
	ids: { keep: string; warning: string }
	actions: CloseActions
}

// An armed close: Close desk, then Keep (the secondary text link) at the row's end; both are
// described by the row's warning, so whichever holds focus says what closing does. Focus
// leaving the pair for another element disarms it; a blur to nowhere (a click on bare page,
// or Safari, which does not focus a clicked button) leaves it armed: Keep, Escape (the owner
// listens on the document) or arming another row still disarm it. While the hub closes the
// desk, Close desk is busy and Keep holds still.
export function ConfirmClose({
	session,
	isClosing,
	ids,
	actions,
}: ConfirmCloseProps): ReactElement {
	return (
		<div
			{...stylex.props(closeControl.cell, closeControl.armed)}
			role="group"
			aria-label={`Confirm closing ${session}`}
			onBlur={event => {
				if (!isClosing && focusLeave(event) === 'outside')
					actions.release()
			}}
		>
			<Button
				tone="danger"
				size="small"
				css={touchTarget.small}
				busy={isClosing}
				busyLabel="Closing…"
				aria-describedby={ids.warning}
				onClick={event => {
					// The second click of a double-click on Close lands here once the row is
					// armed: only a click of its own (or the keyboard, detail 0) confirms.
					if (event.detail > 1) return
					actions.confirm()
				}}
			>
				Close desk
			</Button>
			<TextButton
				id={ids.keep}
				small
				css={touchTarget.small}
				disabled={isClosing}
				aria-label={`Keep desk ${session} open`}
				aria-describedby={ids.warning}
				onClick={actions.keep}
			>
				Keep
			</TextButton>
		</div>
	)
}

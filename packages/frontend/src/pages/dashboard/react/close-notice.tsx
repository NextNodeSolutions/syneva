import { Notice } from '@shared/ui/notice'
import * as stylex from '@stylexjs/stylex'

import { focusTarget, NEW_REVIEW_ID } from '../focus-targets'

import { closeNotice } from './close-notice.styles'

import type { MouseEvent, ReactElement } from 'react'
import type {
	CloseFailure,
	CloseNoticeState,
	CloseOutcome,
} from '../use-close-notice'

type NoticeCopy = {
	tone: 'green' | 'neutral' | 'red'
	lead: string
	rest: string
}

const SAVED = 'Its review stays saved.'

const FAILURE_REST: Record<Exclude<CloseFailure['kind'], 'refused'>, string> = {
	unreachable:
		'The hub did not answer. If the desk is still listed, it is still open.',
	'signed-out': 'This browser is signed out. Sign in again, then close it.',
	unreadable:
		'The hub answered in a shape this page does not read. Reload the page.',
}

function failureRest(cause: CloseFailure): string {
	return cause.kind === 'refused' ? cause.reason : FAILURE_REST[cause.kind]
}

function noticeCopy(outcome: CloseOutcome): NoticeCopy {
	if (outcome.result === 'closed')
		return {
			tone: 'green',
			lead: `Closed ${outcome.session}.`,
			rest: outcome.wasAgentListening
				? `Your agent was told the review ended. ${SAVED}`
				: SAVED,
		}
	if (outcome.result === 'already-closed')
		return {
			tone: 'neutral',
			lead: `${outcome.session} was already closed.`,
			rest: 'Nothing changed.',
		}
	return {
		tone: 'red',
		lead: `Could not close ${outcome.session}.`,
		rest: failureRest(outcome.cause),
	}
}

// Dismissing from the keyboard (a click a key made: detail 0) moves focus to New review rather than falling to the page; a mouse press leaves focus alone - moving it to the header would scroll a long listing back to its top.
function moveFocusOut(event: MouseEvent<HTMLButtonElement>): void {
	if (event.detail !== 0) return
	focusTarget(NEW_REVIEW_ID)
}

export function CloseNotice({
	toast,
}: {
	toast: CloseNoticeState
}): ReactElement {
	const { notice } = toast
	const copy = notice && noticeCopy(notice)
	return (
		<div {...stylex.props(closeNotice.root)} role="status" {...toast.hold}>
			{notice && copy && (
				<div
					key={notice.id}
					inert={toast.isLeaving}
					{...stylex.props(
						closeNotice.sheet,
						toast.isLeaving && closeNotice.leaving,
					)}
				>
					<Notice
						tone={copy.tone}
						lead={copy.lead}
						rule="ink"
						onDismiss={event => {
							moveFocusOut(event)
							toast.dismiss()
						}}
					>
						{copy.rest}
					</Notice>
				</div>
			)}
		</div>
	)
}

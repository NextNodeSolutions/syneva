import { useId, useState } from 'react'

import { refusalMessage, revokeWebHub } from '@entities/hub/api'
import { forgetHub } from '@entities/hub/stream'
import { Button } from '@shared/ui/button'
import { Code } from '@shared/ui/code'
import { Dialog } from '@shared/ui/dialog'
import { DialogBody } from '@shared/ui/dialog-body'
import { DialogFooter } from '@shared/ui/dialog-footer'
import { Notice } from '@shared/ui/notice'
import { TextButton } from '@shared/ui/text-button'
import { touchTarget } from '@shared/ui/touch-target.styles'
import * as stylex from '@stylexjs/stylex'

import { newReviewDialog } from '../react/new-review-dialog.styles'

import type { HubRef } from '@entities/hub/model'
import type { ReactElement } from 'react'

type Revocation = {
	isBusy: boolean
	failure: string | null
	revoke: () => void
}

// The revocation in flight and why the last one failed, in the web's own words. Once the web
// answers, the hub leaves the page's store (the web no longer lists it), not just this dialog.
function useRevocation(hubId: string, onRevoked: () => void): Revocation {
	const [isBusy, setBusy] = useState(false)
	const [failure, setFailure] = useState<string | null>(null)
	const run = async (): Promise<void> => {
		setBusy(true)
		setFailure(null)
		try {
			await revokeWebHub(hubId)
			forgetHub(hubId)
			onRevoked()
		} catch (error) {
			setFailure(
				refusalMessage(error, 'The web did not answer. Try again.'),
			)
			setBusy(false)
		}
	}
	return {
		isBusy,
		failure,
		revoke: () => {
			void run()
		},
	}
}

// What revoking does, said before it is done: the hub's socket closes and its token stops
// working, so it has to pair again before its desks are reachable from here.
function RevokeHubBody({
	hub,
	titleId,
	introId,
	failure,
}: {
	hub: HubRef
	titleId: string
	introId: string
	failure: string | null
}): ReactElement {
	return (
		<DialogBody>
			<h2 id={titleId} {...stylex.props(newReviewDialog.title)}>
				Revoke {hub.name}?
			</h2>
			<p id={introId} {...stylex.props(newReviewDialog.intro)}>
				Its connection to the web closes now and its token stops
				working. Its desks stay on its machine, but you cannot review
				them from here until it pairs again with{' '}
				<Code>syneva login</Code>.
			</p>
			{failure && (
				<Notice tone="red" role="alert" lead="The hub was not revoked.">
					{failure}
				</Notice>
			)}
		</DialogBody>
	)
}

// Revoking is the web's side of `syneva logout`. Asked first, since nothing on this page undoes it.
export function RevokeHubDialog({
	hub,
	onRevoked,
	onClose,
}: {
	hub: HubRef
	onRevoked: () => void
	onClose: () => void
}): ReactElement {
	const titleId = useId()
	const introId = useId()
	const { isBusy, failure, revoke } = useRevocation(hub.id, onRevoked)
	return (
		<Dialog
			open
			caption="Revoke a hub"
			labelledBy={titleId}
			describedBy={introId}
			onClose={onClose}
		>
			<RevokeHubBody
				hub={hub}
				titleId={titleId}
				introId={introId}
				failure={failure}
			/>
			<DialogFooter>
				<TextButton
					css={[touchTarget.large, newReviewDialog.cancel]}
					data-autofocus
					onClick={onClose}
				>
					Keep it
				</TextButton>
				<Button
					tone="danger"
					size="large"
					css={touchTarget.large}
					busy={isBusy}
					busyLabel="Revoking…"
					onClick={revoke}
				>
					Revoke
				</Button>
			</DialogFooter>
		</Dialog>
	)
}

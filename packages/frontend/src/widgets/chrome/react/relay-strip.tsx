import { TextButton } from '@shared/ui/text-button'
import * as stylex from '@stylexjs/stylex'

import { chromeCtx } from '../context'

import { covers } from './desk-covers.styles'

import type { RelayNotice } from '@entities/hub/relay'
import type { ReactElement } from 'react'

const LEAD: Record<RelayNotice, string> = {
	offline: 'Hub offline.',
	timeout: 'Hub took too long.',
}

const REST: Record<RelayNotice, string> = {
	offline:
		"The web cannot reach this desk's hub, so changes made now are not saved. This tab keeps the review on screen and picks up where it left off when the hub is back.",
	timeout:
		'It did not answer in time. What you just did may or may not have gone through: check the review, then try again.',
}

// The strip over a review whose hub the web could not reach (RFC 0001, 4.9). It leaves when the
// hub is heard of again (app/relay-notice.ts); one that was slow can also be dismissed once the
// reviewer has read it. Nothing here tries again: a relayed action is the reviewer's to repeat.
export function RelayStrip({ kind }: { kind: RelayNotice }): ReactElement {
	const { S } = chromeCtx()
	return (
		<div {...stylex.props(covers.notice)} role="status">
			<strong {...stylex.props(covers.noticeLead)}>{LEAD[kind]}</strong>{' '}
			{REST[kind]}{' '}
			{kind === 'timeout' && (
				<TextButton small onClick={() => S.dismissRelayNotice?.()}>
					Dismiss
				</TextButton>
			)}
		</div>
	)
}

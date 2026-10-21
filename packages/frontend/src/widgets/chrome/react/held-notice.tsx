import { RetryCountdown } from '@shared/ui/retry-countdown'
import * as stylex from '@stylexjs/stylex'
import { BRIDGE_LIMITS } from '@syneva/contracts/bridge'

import { covers } from './desk-covers.styles'

import type { HeldStatus } from '@entities/hub/link'
import type { ReactElement } from 'react'

const LEAD: Record<HeldStatus, string> = {
	unreachable: 'Hub not answering.',
	'too-many': 'Too many tabs open.',
	saturated: 'Syneva is saturated.',
}

const REST: Record<HeldStatus, string> = {
	unreachable:
		'Changes made now may not be saved; this tab keeps the review on screen and reconnects by itself.',
	'too-many': `This browser has more tabs on the hub than it serves at once (${BRIDGE_LIMITS.tabsPerUser}). Close some; this tab reconnects by itself.`,
	saturated:
		'Live updates are paused for a few minutes; this tab reconnects by itself.',
}

// The strip over a review whose stream is held off: why, and when it tries again.
export function HeldNotice({
	status,
	retryAt,
}: {
	status: HeldStatus
	retryAt: number | null
}): ReactElement {
	return (
		<div {...stylex.props(covers.notice)} role="status">
			<strong {...stylex.props(covers.noticeLead)}>{LEAD[status]}</strong>{' '}
			{REST[status]} <RetryCountdown retryAt={retryAt} />
		</div>
	)
}

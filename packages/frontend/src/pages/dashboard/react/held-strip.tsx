import { isHeldOff } from '@entities/hub/held'
import { hubPlace } from '@entities/hub/hub-place'
import { Code } from '@shared/ui/code'
import { RetryCountdown } from '@shared/ui/retry-countdown'
import * as stylex from '@stylexjs/stylex'
import { BRIDGE_LIMITS } from '@syneva/contracts/bridge'

import { heldStrip } from './held-strip.styles'

import type { HubPlace } from '@entities/hub/hub-place'
import type { HeldStatus, HubStatus } from '@entities/hub/link'
import type { ReactElement, ReactNode } from 'react'

const RESTART: Record<HubPlace, ReactElement> = {
	loopback: (
		<>
			run <Code onPaper>syneva start</Code> on its machine
		</>
	),
	network: (
		<>
			start it again on its machine with the same{' '}
			<Code onPaper>--host</Code> and <Code onPaper>--key</Code>
		</>
	),
}

function words(status: HeldStatus): { lead: string; rest: ReactNode } {
	if (status === 'too-many')
		return {
			lead: 'Too many tabs open.',
			rest: `This browser has more tabs on the hub than it serves at once (${BRIDGE_LIMITS.tabsPerUser}). Close some; this page keeps the last listing and reconnects by itself.`,
		}
	if (status === 'saturated')
		return {
			lead: 'Syneva is saturated.',
			rest: 'Live updates are paused for a few minutes. This page keeps the last listing and reconnects by itself.',
		}
	return {
		lead: 'The hub is not answering.',
		rest: (
			<>
				If it was stopped, {RESTART[hubPlace()]}. This page keeps the
				last listing and reconnects by itself.
			</>
		),
	}
}

// Over a listing the stream no longer keeps current: why it waits, and when it tries again. The
// status region stays mounted so its sentence is announced when it appears, not the countdown.
export function HeldStrip({
	isShown,
	status,
	retryAt,
}: {
	isShown: boolean
	status: HubStatus
	retryAt: number | null
}): ReactElement {
	if (!isShown || !isHeldOff(status)) return <div role="status" />
	const { lead, rest } = words(status)
	const isWait = status !== 'unreachable'
	return (
		<div role="status">
			<div {...stylex.props(heldStrip.root, isWait && heldStrip.wait)}>
				<span
					{...stylex.props(
						heldStrip.square,
						isWait && heldStrip.waitSquare,
					)}
					aria-hidden="true"
				/>
				<p>
					<span {...stylex.props(heldStrip.lead)}>{lead}</span>{' '}
					<span {...stylex.props(heldStrip.rest)}>
						{rest} <RetryCountdown retryAt={retryAt} />
					</span>
				</p>
			</div>
		</div>
	)
}

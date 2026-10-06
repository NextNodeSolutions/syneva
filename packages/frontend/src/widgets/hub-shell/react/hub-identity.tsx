import { hubPlace } from '@entities/hub/hub-place'
import { LiveDot } from '@shared/ui/live-dot'
import * as stylex from '@stylexjs/stylex'

import { HUB_STATE } from '../hub-state'

import { hubIdentity } from './hub-identity.styles'
import { sidebar } from './hub-sidebar.styles'

import type { HubStatus } from '@entities/hub/use-hub'
import type { ReactElement } from 'react'

// Which hub this is and how it answers: a hub on this machine's loopback is the local one; one
// reached over the network is hosted (started with --host and --key). Its square pulses while
// the hub answers, turns red when it does not.
export function HubIdentity({
	status,
	isFolded,
}: {
	status: HubStatus
	isFolded: boolean
}): ReactElement {
	const isLocal = hubPlace() === 'loopback'
	const state = HUB_STATE[status]
	return (
		<div
			{...stylex.props(hubIdentity.root, isFolded && hubIdentity.folded)}
			data-enter="fade"
			title={`${isLocal ? 'Local hub' : 'Hosted hub'} · ${state.word}`}
		>
			<LiveDot tone={state.tone} live={state.isLive} />
			<p
				{...stylex.props(
					hubIdentity.text,
					sidebar.label,
					isFolded && sidebar.labelFolded,
				)}
			>
				<span {...stylex.props(hubIdentity.name)}>
					{isLocal ? 'Local hub' : 'Hosted hub'}
				</span>
				<span {...stylex.props(hubIdentity.where)}>
					{window.location.host}
				</span>
			</p>
		</div>
	)
}

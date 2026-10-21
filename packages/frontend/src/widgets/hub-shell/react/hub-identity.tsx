import { hubPlace } from '@entities/hub/hub-place'
import { useHubMode } from '@entities/hub/use-hubs'
import { LiveDot } from '@shared/ui/live-dot'
import * as stylex from '@stylexjs/stylex'

import { HUB_STATE } from '../hub-state'

import { hubIdentity } from './hub-identity.styles'
import { sidebar } from './hub-sidebar.styles'

import type { HubStatus } from '@entities/hub/link'
import type { HubMode } from '@entities/hub/mode'
import type { ReactElement } from 'react'

// Which hub this is and how it answers: a hub on this machine's loopback is the local one; one
// reached over the network is hosted (started with --host and --key); the web (RFC 0001, 3.3)
// is neither, whatever address serves it, and the stream says so before the address could. Its
// square pulses while the hub answers, turns red when it does not.
function hubWord(mode: HubMode | null): string {
	if (mode === 'web') return 'Web'
	return hubPlace() === 'loopback' ? 'Local hub' : 'Hosted hub'
}

export function HubIdentity({
	status,
	isFolded,
}: {
	status: HubStatus
	isFolded: boolean
}): ReactElement {
	const name = hubWord(useHubMode())
	const state = HUB_STATE[status]
	return (
		<div
			{...stylex.props(hubIdentity.root, isFolded && hubIdentity.folded)}
			data-enter="fade"
			title={`${name} · ${state.word}`}
		>
			<LiveDot tone={state.tone} live={state.isLive} />
			<p
				{...stylex.props(
					hubIdentity.text,
					sidebar.label,
					isFolded && sidebar.labelFolded,
				)}
			>
				<span {...stylex.props(hubIdentity.name)}>{name}</span>
				<span {...stylex.props(hubIdentity.where)}>
					{window.location.host}
				</span>
			</p>
		</div>
	)
}

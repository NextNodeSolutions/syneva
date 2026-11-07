import * as stylex from '@stylexjs/stylex'
import { tag } from '@syneva/design-system/controls.styles'

import { agentLabel } from '../model/agents'

import { launchVerdict } from './launch-verdict.styles'

import type { ReactElement } from 'react'
import type { AgentId } from '../model/agents'

// The agents ticked, in petrol: the agent's colour across the site.
export function AgentTags({
	agents,
}: {
	agents: readonly AgentId[]
}): ReactElement {
	return (
		<span {...stylex.props(launchVerdict.tags)}>
			{agents.map(agent => (
				<span key={agent} {...stylex.props(tag.base, tag.accent)}>
					{agentLabel(agent)}
				</span>
			))}
		</span>
	)
}

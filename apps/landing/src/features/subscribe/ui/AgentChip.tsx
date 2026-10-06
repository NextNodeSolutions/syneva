import * as stylex from '@stylexjs/stylex'

import { AGENT_FIELD } from '../model/endpoint'

import { agentPicker } from './agent-picker.styles'

import type { ReactElement } from 'react'
import type { AgentId } from '../model/agents'

type AgentChipProps = {
	agent: { id: AgentId; label: string }
	isPicked: boolean
	onToggle: (id: AgentId, isPicked: boolean) => void
}

export function AgentChip({
	agent,
	isPicked,
	onToggle,
}: AgentChipProps): ReactElement {
	return (
		<label
			{...stylex.props(
				agentPicker.chip,
				isPicked && agentPicker.chipPicked,
			)}
		>
			<input
				{...stylex.props(agentPicker.diamond)}
				type="checkbox"
				name={AGENT_FIELD}
				value={agent.id}
				checked={isPicked}
				onChange={event =>
					onToggle(agent.id, event.currentTarget.checked)
				}
			/>
			{agent.label}
		</label>
	)
}

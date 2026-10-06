import * as stylex from '@stylexjs/stylex'

import { AGENTS, pickAgents } from '../model/agents'

import { agentPicker } from './agent-picker.styles'
import { AgentChip } from './AgentChip'
import { fieldText } from './field.styles'

import type { ReactElement } from 'react'
import type { AgentId } from '../model/agents'

type AgentPickerProps = {
	legend: string
	aside: string
	picked: readonly AgentId[]
	onPick: (agents: AgentId[]) => void
}

// Native checkboxes under the chips: Space ticks, Tab walks them, and a form posted without scripts sends one `agent` per tick.
export function AgentPicker({
	legend,
	aside,
	picked,
	onPick,
}: AgentPickerProps): ReactElement {
	const toggle = (id: AgentId, isPicked: boolean): void =>
		onPick(
			pickAgents(
				isPicked
					? [...picked, id]
					: picked.filter(agent => agent !== id),
			),
		)
	return (
		<fieldset {...stylex.props(agentPicker.fieldset)}>
			<legend {...stylex.props(agentPicker.legend)}>
				<span {...stylex.props(fieldText.labelRow)}>
					<span {...stylex.props(fieldText.label)}>{legend}</span>
					<span {...stylex.props(fieldText.aside)}>{aside}</span>
				</span>
			</legend>
			<div {...stylex.props(agentPicker.chips)}>
				{AGENTS.map(agent => (
					<AgentChip
						key={agent.id}
						agent={agent}
						isPicked={picked.includes(agent.id)}
						onToggle={toggle}
					/>
				))}
			</div>
		</fieldset>
	)
}

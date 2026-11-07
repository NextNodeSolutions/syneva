import * as stylex from '@stylexjs/stylex'
import { caption } from '@syneva/design-system/controls.styles'

import { AGENTS, pickAgents } from '../model/agents'

import { agentPicker } from './agent-picker.styles'
import { AgentChip } from './AgentChip'
import { fieldText } from './field.styles'
import { reset } from './reset.styles'

import type { ReactElement } from 'react'
import type { AgentId } from '../model/agents'

type AgentPickerProps = {
	picked: readonly AgentId[]
	onPick: (agents: AgentId[]) => void
}

// Native checkboxes under the chips: Space ticks, Tab walks them, and a form posted without scripts sends one `agent` per tick.
export function AgentPicker({
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
		<fieldset {...stylex.props(reset.border, agentPicker.fieldset)}>
			<legend {...stylex.props(agentPicker.legend)}>
				<span {...stylex.props(fieldText.labelRow)}>
					<span {...stylex.props(fieldText.label)}>
						Which agents write your code?
					</span>
					<span {...stylex.props(caption.base)}>optional</span>
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

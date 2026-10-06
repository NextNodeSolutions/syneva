import * as stylex from '@stylexjs/stylex'

import { AgentTags } from './AgentTags'
import { launchVerdict } from './launch-verdict.styles'
import { SheetRow } from './SheetRow'
import { VerdictEntry } from './VerdictEntry'
import { VerdictHeading } from './VerdictHeading'

import type { ReactElement, ReactNode } from 'react'
import type { Signup } from '../model/signup'

type LaunchVerdictProps = {
	signup: Signup
	hasFocus: boolean
	onLeave: () => void
	// What launch day brings, rendered by Astro (LaunchDay.astro).
	children?: ReactNode
}

// The sheet once the address is in: what was left, checked off line by line, then what launch day brings.
export function LaunchVerdict({
	signup,
	hasFocus,
	onLeave,
	children,
}: LaunchVerdictProps): ReactElement {
	const { email, name, agents } = signup
	const hasAgents = agents.length > 0
	return (
		<>
			<SheetRow line={1} state="joined">
				<VerdictEntry caption="email">
					<span
						{...stylex.props(
							launchVerdict.value,
							launchVerdict.email,
						)}
					>
						{email}
					</span>
				</VerdictEntry>
			</SheetRow>
			{name && (
				<SheetRow line={2} state="joined" order={1}>
					<VerdictEntry caption="name">
						<span {...stylex.props(launchVerdict.value)}>
							{name}
						</span>
					</VerdictEntry>
				</SheetRow>
			)}
			{hasAgents && (
				<SheetRow line={3} state="joined" order={2}>
					<VerdictEntry
						caption={agents.length > 1 ? 'agents' : 'agent'}
					>
						<AgentTags agents={agents} />
					</VerdictEntry>
				</SheetRow>
			)}
			<VerdictHeading name={name} hasFocus={hasFocus} onLeave={onLeave} />
			{children}
		</>
	)
}

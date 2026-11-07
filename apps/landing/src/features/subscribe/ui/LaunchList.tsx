import { useJoining } from '../model/joined'

import { LaunchBar } from './LaunchBar'
import { LaunchForm } from './LaunchForm'
import { LaunchVerdict } from './LaunchVerdict'

import type { ReactElement, ReactNode } from 'react'

type LaunchListProps = {
	// Static markup the Astro side renders (LaunchListSignup.astro): the trap field for the form, and what launch day brings for the verdict.
	children?: ReactNode
	launchDay?: ReactNode
}

// The start band's island: what changes with the visitor's signup, the title bar and the form, then the verdict.
export function LaunchList({
	children,
	launchDay,
}: LaunchListProps): ReactElement {
	const { signup, hasFocus, join, leave } = useJoining()
	return (
		<>
			<LaunchBar isJoined={Boolean(signup)} />
			{signup ? (
				<LaunchVerdict
					signup={signup}
					hasFocus={hasFocus}
					onLeave={leave}
				>
					{launchDay}
				</LaunchVerdict>
			) : (
				<LaunchForm hasFocus={hasFocus} onJoined={join}>
					{children}
				</LaunchForm>
			)}
		</>
	)
}

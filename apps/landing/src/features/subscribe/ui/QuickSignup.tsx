import { useJoining } from '../model/joined'

import { QuickForm } from './QuickForm'
import { QuickJoined } from './QuickJoined'

import type { ReactElement, ReactNode } from 'react'

const PROMISE = 'One email, the day Syneva installs.'

// The hero's island: the address alone, then the verdict in its place. `children` is the trap field Astro renders (HeroSignup.astro).
export function QuickSignup({
	children,
}: {
	children?: ReactNode
}): ReactElement {
	const { signup, hasFocus, join, leave } = useJoining()
	return signup ? (
		<QuickJoined
			signup={signup}
			promise={PROMISE}
			hasFocus={hasFocus}
			onLeave={leave}
		/>
	) : (
		<QuickForm promise={PROMISE} hasFocus={hasFocus} onJoined={join}>
			{children}
		</QuickForm>
	)
}

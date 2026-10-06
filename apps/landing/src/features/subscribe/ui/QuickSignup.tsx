import { useJoining } from '../model/joined'

import { QuickForm } from './QuickForm'
import { QuickJoined } from './QuickJoined'

import type { ReactElement, ReactNode } from 'react'

// The hero's island: the address alone, then the verdict in its place. `children` is the trap field Astro renders (HeroSignup.astro).
export function QuickSignup({
	children,
}: {
	children?: ReactNode
}): ReactElement {
	const { signup, hasFocus, join, leave } = useJoining()
	return signup ? (
		<QuickJoined signup={signup} hasFocus={hasFocus} onLeave={leave} />
	) : (
		<QuickForm hasFocus={hasFocus} onJoined={join}>
			{children}
		</QuickForm>
	)
}

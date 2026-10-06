import * as stylex from '@stylexjs/stylex'

import { SUBSCRIBE_PATH } from '../model/endpoint'
import { useHydrated } from '../model/use-hydrated'

import type { ReactElement, ReactNode } from 'react'
import type { SignupForm } from '../model/use-signup-form'

const listForm = stylex.create({
	root: { position: 'relative', minWidth: 0, marginBlock: 0 },
})

// Both signups' <form>: it posts to the endpoint without scripts too, and keeps the browser's own checks until the island runs its own.
export function ListForm({
	form,
	children,
}: {
	form: SignupForm
	children: ReactNode
}): ReactElement {
	const isHydrated = useHydrated()
	return (
		<form
			{...stylex.props(listForm.root)}
			method="post"
			action={SUBSCRIBE_PATH}
			noValidate={isHydrated}
			aria-busy={form.isSending || undefined}
			onSubmit={form.submit}
		>
			{children}
		</form>
	)
}

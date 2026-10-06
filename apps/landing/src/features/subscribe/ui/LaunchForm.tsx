import { useRef } from 'react'

import * as stylex from '@stylexjs/stylex'

import { SUBSCRIBE_PATH } from '../model/endpoint'
import { useHydrated } from '../model/use-hydrated'
import { useSignupForm } from '../model/use-signup-form'

import { launchForm } from './launch-form.styles'
import { LaunchFields } from './LaunchFields'
import { LaunchFoot } from './LaunchFoot'

import type { ReactElement, ReactNode } from 'react'
import type { Signup } from '../model/signup'

type LaunchFormProps = {
	// The form comes back after "Use another address": the caret returns to its address.
	hasFocus: boolean
	onJoined: (signup: Signup) => void
	// The trap field, rendered by Astro: it must sit inside the form.
	children?: ReactNode
}

export function LaunchForm({
	hasFocus,
	onJoined,
	children,
}: LaunchFormProps): ReactElement {
	const emailField = useRef<HTMLInputElement>(null)
	const form = useSignupForm(onJoined, () => emailField.current?.focus())
	const isHydrated = useHydrated()
	return (
		<form
			{...stylex.props(launchForm.form)}
			method="post"
			action={SUBSCRIBE_PATH}
			noValidate={isHydrated}
			aria-busy={form.isSending || undefined}
			onSubmit={form.submit}
		>
			<LaunchFields
				form={form}
				emailField={emailField}
				hasFocus={hasFocus}
			/>
			{children}
			<LaunchFoot notice={form.notice} isSending={form.isSending} />
		</form>
	)
}

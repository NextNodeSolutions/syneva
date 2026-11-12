import { account } from '@shared/ui/account.styles'
import { ActionButton } from '@shared/ui/ActionButton'
import * as stylex from '@stylexjs/stylex'

import { useEmailAuthentication } from '../model/use-email-authentication'

import { LoginFields } from './LoginFields'

import type { ReactElement } from 'react'

export function LoginForm({
	onSignedIn,
}: {
	onSignedIn: () => Promise<void>
}): ReactElement {
	const { isCreating, authentication, switchMode } =
		useEmailAuthentication(onSignedIn)
	const submitLabel = isCreating ? 'Create account' : 'Sign in with email'
	return (
		<>
			<form
				onSubmit={event => {
					event.preventDefault()
					authentication.mutate(new FormData(event.currentTarget))
				}}
				{...stylex.props(account.form)}
			>
				<LoginFields isCreating={isCreating} />
				{authentication.error && (
					<p role="alert" {...stylex.props(account.error)}>
						{authentication.error.message}
					</p>
				)}
				<ActionButton
					type="submit"
					tone="secondary"
					disabled={authentication.isPending}
				>
					{authentication.isPending ? 'Please wait…' : submitLabel}
				</ActionButton>
			</form>
			<button
				type="button"
				disabled={authentication.isPending}
				onClick={switchMode}
				{...stylex.props(account.link)}
			>
				{isCreating
					? 'Already have an account? Sign in'
					: 'New to Syneva? Create an account'}
			</button>
		</>
	)
}

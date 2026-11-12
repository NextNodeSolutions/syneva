import { signInGithub } from '@shared/auth/client'
import { account } from '@shared/ui/account.styles'
import { ActionButton } from '@shared/ui/ActionButton'
import { DocumentTitle } from '@shared/ui/DocumentTitle'
import * as stylex from '@stylexjs/stylex'
import { WORDMARK } from '@syneva/design-system/brand'
import { useMutation } from '@tanstack/react-query'

import { LoginForm } from './LoginForm'

import type { ReactElement } from 'react'

export function LoginPage({
	onSignedIn,
}: {
	onSignedIn: () => Promise<void>
}): ReactElement {
	const github = useMutation({ mutationFn: signInGithub })
	const callbackFailure = new URLSearchParams(window.location.search).has(
		'error',
	)
		? 'GitHub sign-in failed. If you already have a Syneva account, sign in with your password and connect GitHub in Settings.'
		: ''
	const failure = github.error?.message ?? callbackFailure
	return (
		<main {...stylex.props(account.login)}>
			<DocumentTitle title="Sign in" />
			<div {...stylex.props(account.panel)}>
				<h1 {...stylex.props(account.title)}>Sign in to {WORDMARK}</h1>
				<p {...stylex.props(account.copy)}>
					Your pull requests, ready to review.
				</p>
				<ActionButton
					disabled={github.isPending}
					onClick={() => {
						github.mutate()
					}}
				>
					{github.isPending
						? 'Connecting to GitHub…'
						: 'Continue with GitHub'}
				</ActionButton>
				{failure && (
					<p role="alert" {...stylex.props(account.error)}>
						{failure}
					</p>
				)}
				<LoginForm onSignedIn={onSignedIn} />
			</div>
		</main>
	)
}

import { account } from '@shared/ui/account.styles'
import * as stylex from '@stylexjs/stylex'
import { MIN_PASSWORD_LENGTH } from '@syneva/contracts/auth'

import type { ReactElement } from 'react'

const MAX_NAME_LENGTH = 100

export function LoginFields({
	isCreating,
}: {
	isCreating: boolean
}): ReactElement {
	return (
		<>
			{isCreating && (
				<label {...stylex.props(account.field)}>
					Name
					<input
						name="name"
						required
						autoComplete="name"
						maxLength={MAX_NAME_LENGTH}
						{...stylex.props(account.input)}
					/>
				</label>
			)}
			<label {...stylex.props(account.field)}>
				Email
				<input
					name="email"
					type="email"
					required
					autoComplete="email"
					{...stylex.props(account.input)}
				/>
			</label>
			<label {...stylex.props(account.field)}>
				Password
				<input
					name="password"
					type="password"
					required
					minLength={isCreating ? MIN_PASSWORD_LENGTH : undefined}
					autoComplete={
						isCreating ? 'new-password' : 'current-password'
					}
					{...stylex.props(account.input)}
				/>
			</label>
			{isCreating && (
				<p {...stylex.props(account.copy)}>
					Use at least {MIN_PASSWORD_LENGTH} characters.
				</p>
			)}
		</>
	)
}

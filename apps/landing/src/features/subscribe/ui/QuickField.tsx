import * as stylex from '@stylexjs/stylex'

import { EMAIL_INPUT } from './field-inputs'
import { quickSignup } from './quick-signup.styles'

import type { ReactElement, RefObject } from 'react'
import type { SignupForm } from '../model/use-signup-form'

type QuickFieldProps = {
	form: SignupForm
	emailField: RefObject<HTMLInputElement | null>
	noteId: string
	hasFocus: boolean
}

// The address, labelled for screen readers only: the box and its placeholder say what it is.
export function QuickField({
	form,
	emailField,
	noteId,
	hasFocus,
}: QuickFieldProps): ReactElement {
	return (
		<label {...stylex.props(quickSignup.field)}>
			<span {...stylex.props(quickSignup.hidden)}>Email address</span>
			<input
				{...EMAIL_INPUT}
				ref={emailField}
				{...stylex.props(quickSignup.input)}
				value={form.draft.email}
				autoFocus={hasFocus}
				aria-invalid={Boolean(form.emailProblem) || undefined}
				aria-describedby={noteId}
				onChange={event =>
					form.edit({ email: event.currentTarget.value })
				}
				onBlur={form.checkEmail}
			/>
		</label>
	)
}

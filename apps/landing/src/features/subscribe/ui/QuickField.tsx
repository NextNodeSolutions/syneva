import * as stylex from '@stylexjs/stylex'
import { a11y } from '@syneva/design-system/a11y.styles'

import { EMAIL_INPUT } from './field-inputs'
import { quickSignup } from './quick-signup.styles'
import { reset } from './reset.styles'

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
			<span {...stylex.props(a11y.srOnly)}>Email address</span>
			<input
				{...EMAIL_INPUT}
				ref={emailField}
				{...stylex.props(reset.border, quickSignup.input)}
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

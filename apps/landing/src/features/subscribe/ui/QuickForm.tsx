import { useId, useRef } from 'react'

import * as stylex from '@stylexjs/stylex'

import { useSignupForm } from '../model/use-signup-form'

import { ListForm } from './ListForm'
import { quickSignup } from './quick-signup.styles'
import { QuickField } from './QuickField'
import { QuickNote } from './QuickNote'
import { SendButton } from './SendButton'

import type { ReactElement, ReactNode } from 'react'
import type { Signup } from '../model/signup'

type QuickFormProps = {
	hasFocus: boolean
	onJoined: (signup: Signup) => void
	// The trap field, rendered by Astro: it must sit inside the form.
	children?: ReactNode
}

// The hero's form: the address alone, one press from the list; the start band asks for the rest.
export function QuickForm({
	hasFocus,
	onJoined,
	children,
}: QuickFormProps): ReactElement {
	const emailField = useRef<HTMLInputElement>(null)
	const form = useSignupForm(onJoined, emailField)
	const noteId = useId()
	return (
		<ListForm form={form}>
			<div
				{...stylex.props(
					quickSignup.box,
					Boolean(form.emailProblem) && quickSignup.boxRefused,
				)}
			>
				<QuickField
					form={form}
					emailField={emailField}
					noteId={noteId}
					hasFocus={hasFocus}
				/>
				<SendButton isSending={form.isSending} css={quickSignup.send}>
					Notify me
				</SendButton>
			</div>
			{children}
			<QuickNote
				id={noteId}
				emailProblem={form.emailProblem}
				notice={form.notice}
			/>
		</ListForm>
	)
}

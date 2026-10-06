import { useId, useRef } from 'react'

import * as stylex from '@stylexjs/stylex'

import { SUBSCRIBE_PATH } from '../model/endpoint'
import { useHydrated } from '../model/use-hydrated'
import { useSignupForm } from '../model/use-signup-form'

import { quickSignup } from './quick-signup.styles'
import { QuickField } from './QuickField'
import { QuickNote } from './QuickNote'
import { SendButton } from './SendButton'

import type { ReactElement, ReactNode } from 'react'
import type { Signup } from '../model/signup'

type QuickFormProps = {
	promise: string
	hasFocus: boolean
	onJoined: (signup: Signup) => void
	// The trap field, rendered by Astro: it must sit inside the form.
	children?: ReactNode
}

// The hero's form: the address alone, one press from the list; the start band asks for the rest.
export function QuickForm({
	promise,
	hasFocus,
	onJoined,
	children,
}: QuickFormProps): ReactElement {
	const emailField = useRef<HTMLInputElement>(null)
	const form = useSignupForm(onJoined, () => emailField.current?.focus())
	const isHydrated = useHydrated()
	const noteId = useId()
	const { emailProblem, notice } = form
	const refusal = notice?.tone === 'refused' ? notice.text : emailProblem
	return (
		<form
			{...stylex.props(quickSignup.form)}
			method="post"
			action={SUBSCRIBE_PATH}
			noValidate={isHydrated}
			aria-busy={form.isSending || undefined}
			onSubmit={form.submit}
		>
			<div
				{...stylex.props(
					quickSignup.box,
					Boolean(emailProblem) && quickSignup.boxRefused,
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
				promise={promise}
				refusal={refusal}
				progress={notice?.tone === 'sending' ? notice.text : undefined}
			/>
		</form>
	)
}

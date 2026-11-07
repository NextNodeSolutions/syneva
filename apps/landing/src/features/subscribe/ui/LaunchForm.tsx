import { useRef } from 'react'

import * as stylex from '@stylexjs/stylex'

import { useSignupForm } from '../model/use-signup-form'

import { fieldText } from './field.styles'
import { launchForm } from './launch-form.styles'
import { LaunchFields } from './LaunchFields'
import { ListForm } from './ListForm'
import { SendButton } from './SendButton'

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
	const form = useSignupForm(onJoined, emailField)
	const { notice } = form
	return (
		<ListForm form={form}>
			<LaunchFields
				form={form}
				emailField={emailField}
				hasFocus={hasFocus}
			/>
			{children}
			<div {...stylex.props(launchForm.foot)}>
				<SendButton isSending={form.isSending} css={launchForm.send}>
					Notify me at launch
				</SendButton>
				<p
					{...stylex.props(
						fieldText.status,
						notice?.tone === 'refused' && fieldText.statusRefused,
					)}
					role="status"
				>
					{notice?.text}
				</p>
			</div>
		</ListForm>
	)
}

import { AgentPicker } from './AgentPicker'
import { EMAIL_INPUT, NAME_INPUT } from './field-inputs'
import { LineField } from './LineField'
import { SheetRow } from './SheetRow'

import type { ReactElement, RefObject } from 'react'
import type { SignupForm } from '../model/use-signup-form'
import type { RowState } from './RowMark'

type LaunchFieldsProps = {
	form: SignupForm
	emailField: RefObject<HTMLInputElement | null>
	hasFocus: boolean
}

const rowState = (typed: string, problem?: string): RowState => {
	if (problem) return 'refused'
	return typed.trim() === '' ? 'open' : 'added'
}

// The sheet's three lines: the address, then what is optional.
export function LaunchFields({
	form,
	emailField,
	hasFocus,
}: LaunchFieldsProps): ReactElement {
	const { draft, edit } = form
	return (
		<>
			<SheetRow line={1} state={rowState(draft.email, form.emailProblem)}>
				<LineField
					{...EMAIL_INPUT}
					ref={emailField}
					label="Email"
					problem={form.emailProblem}
					value={draft.email}
					autoFocus={hasFocus}
					onChange={event =>
						edit({ email: event.currentTarget.value })
					}
					onBlur={form.checkEmail}
				/>
			</SheetRow>
			<SheetRow line={2} state={rowState(draft.name)}>
				<LineField
					{...NAME_INPUT}
					label="First name"
					aside="optional"
					value={draft.name}
					onChange={event =>
						edit({ name: event.currentTarget.value })
					}
				/>
			</SheetRow>
			<SheetRow
				line={3}
				state={draft.agents.length > 0 ? 'added' : 'open'}
			>
				<AgentPicker
					legend="Which agents write your code?"
					aside="optional"
					picked={draft.agents}
					onPick={agents => edit({ agents })}
				/>
			</SheetRow>
		</>
	)
}

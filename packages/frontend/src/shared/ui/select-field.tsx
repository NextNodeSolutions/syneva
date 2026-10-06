import { useId } from 'react'

import * as stylex from '@stylexjs/stylex'
import { field } from '@syneva/design-system/controls.styles'

import { FieldLabel } from './field-label'
import { FieldNote } from './field-note'
import { fieldParts } from './field-parts.styles'

import type { ComponentPropsWithRef, ReactElement } from 'react'
import type { FieldText } from './field-text'

type SelectOption = { value: string; label: string }

type SelectFieldProps = FieldText & {
	options: readonly SelectOption[]
} & Omit<
		ComponentPropsWithRef<'select'>,
		'className' | 'style' | 'id' | 'children'
	>

// Every native select attribute (value, onChange, ref) reaches the select; the label wiring is the field's own.
export function SelectField({
	label,
	aside,
	hint,
	error,
	options,
	...select
}: SelectFieldProps): ReactElement {
	const id = useId()
	const noteId = `${id}-note`
	const isInvalid = Boolean(error)
	return (
		<div>
			<FieldLabel htmlFor={id} aside={aside}>
				{label}
			</FieldLabel>
			<span {...stylex.props(field.selectBox, fieldParts.control)}>
				<select
					{...select}
					{...stylex.props(
						field.base,
						field.select,
						isInvalid && field.invalid,
					)}
					id={id}
					aria-invalid={isInvalid || undefined}
					aria-describedby={error || hint ? noteId : undefined}
				>
					{options.map(option => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>
				<svg
					{...stylex.props(field.chevron)}
					viewBox="0 0 12 12"
					aria-hidden="true"
				>
					<path d="M2 4l4 4 4-4" />
				</svg>
			</span>
			<FieldNote id={noteId} hint={hint} error={error} />
		</div>
	)
}

import { useState } from 'react'

import { useOpenDesk } from './use-open-desk'

import type { NewDeskInput } from '@entities/hub/model'
import type { FormEvent } from 'react'
import type { OpenRefusal } from './use-open-desk'

// What to review: the four sources the CLI opens, in the site's workflow order.
export type Source = 'working' | 'staged' | 'pr' | 'file'

// The sources that read a target, each keeping its own: a file path typed for one file never
// becomes the ref a pull request checks out.
type TargetSource = Extract<Source, 'pr' | 'file'>

export type Fields = {
	root: string
	source: Source
	targets: Record<TargetSource, string>
	session: string
}

// The fields a submit can find wanting, with what to say about each.
export type FieldErrors = {
	root?: string | undefined
	target?: string | undefined
}

export type NewReview = {
	fields: Fields
	setRoot: (root: string) => void
	setSource: (source: Source) => void
	setTarget: (source: TargetSource, target: string) => void
	setSession: (session: string) => void
	errors: FieldErrors
	refusal: OpenRefusal | null
	isBusy: boolean
	submit: (event: FormEvent<HTMLFormElement>) => void
	// Abandon an open in flight (the dialog closed while the hub was still opening).
	abort: () => void
}

const BLANK: Fields = {
	root: '',
	source: 'working',
	targets: { pr: '', file: '' },
	session: '',
}

// The checked fields in the form's order (each input is named after its field): the first
// one wanting takes focus.
const FIELD_ORDER = [
	'root',
	'target',
] as const satisfies readonly (keyof FieldErrors)[]

const NO_ERRORS: FieldErrors = {}

function focusField(form: HTMLFormElement, name: string): void {
	const input = form.elements.namedItem(name)
	if (input instanceof HTMLElement) input.focus()
}

export function needsTarget(source: Source): source is TargetSource {
	return source === 'pr' || source === 'file'
}

function validate(fields: Fields): FieldErrors {
	return {
		...(!fields.root.trim() && {
			root: "Name the repository's path on the hub's machine.",
		}),
		...(fields.source === 'file' &&
			!fields.targets.file.trim() && {
				target: 'Name the file to review.',
			}),
	}
}

// The open the CLI performs, from the form. A target only travels with the source that
// reads it; blank optional fields are left for the hub to default.
function toInput(fields: Fields): NewDeskInput {
	const { source } = fields
	return {
		root: fields.root.trim(),
		mode: needsTarget(source) ? source : 'repo',
		staged: source === 'staged',
		target: needsTarget(source)
			? fields.targets[source].trim() || undefined
			: undefined,
		session: fields.session.trim() || undefined,
	}
}

type FieldSetters = Pick<
	NewReview,
	'setRoot' | 'setSource' | 'setTarget' | 'setSession'
>

// Each setter edits its field and clears the error a submit left on it.
function fieldSetters(
	edit: (next: (current: Fields) => Fields) => void,
	clearError: (key: keyof FieldErrors) => void,
): FieldSetters {
	return {
		setRoot: root => {
			edit(current => ({ ...current, root }))
			clearError('root')
		},
		setSource: source => {
			edit(current => ({ ...current, source }))
			clearError('target')
		},
		setTarget: (source, target) => {
			edit(current => ({
				...current,
				targets: { ...current.targets, [source]: target },
			}))
			clearError('target')
		},
		setSession: session => edit(current => ({ ...current, session })),
	}
}

// The New review form: its fields, the validation a submit runs (each error stands until its
// field is edited or the next submit; a field the submit did not flag is never shown wanting),
// and the one action, the open (use-open-desk.ts). While it runs, the fields hold still.
export function useNewReview(): NewReview {
	const [fields, setFields] = useState(BLANK)
	const [errors, setErrors] = useState(NO_ERRORS)
	const desk = useOpenDesk()
	const setters = fieldSetters(
		next => {
			if (!desk.isBusy) setFields(next)
		},
		key => setErrors(current => ({ ...current, [key]: undefined })),
	)
	return {
		fields,
		...setters,
		errors,
		refusal: desk.refusal,
		isBusy: desk.isBusy,
		submit: event => {
			event.preventDefault()
			if (desk.isBusy) return
			const found = validate(fields)
			setErrors(found)
			const firstInvalid = FIELD_ORDER.find(key => found[key])
			if (firstInvalid) {
				focusField(event.currentTarget, firstInvalid)
				return
			}
			desk.open(toInput(fields))
		},
		abort: desk.abort,
	}
}

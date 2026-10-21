import { useState } from 'react'

import { useOpenDesk } from './use-open-desk'

import type { HubRef, NewDeskInput } from '@entities/hub/model'
import type { FormEvent } from 'react'
import type { OpenRefusal } from './use-open-desk'

export type Source = 'working' | 'staged' | 'pr' | 'file'

type TargetSource = Extract<Source, 'pr' | 'file'>

export type Fields = {
	// The hub the reviewer picked, null until they do (hubToOpenOn says where it then lands).
	hubId: string | null
	root: string
	source: Source
	targets: Record<TargetSource, string>
	session: string
}

export type FieldErrors = {
	hub?: string | undefined
	root?: string | undefined
	target?: string | undefined
}

export type NewReview = {
	fields: Fields
	// The hubs the open can go to (more than one only on the web) and the one it will: the pick
	// when it is online, else the first online hub, null when none is.
	hubs: readonly HubRef[]
	hubId: string | null
	// Whether the dialog asks for the hub (isHubAsked).
	asksHub: boolean
	setHub: (hubId: string) => void
	setRoot: (root: string) => void
	setSource: (source: Source) => void
	setTarget: (source: TargetSource, target: string) => void
	setSession: (session: string) => void
	errors: FieldErrors
	refusal: OpenRefusal | null
	isBusy: boolean
	submit: (event: FormEvent<HTMLFormElement>) => void
	abort: () => void
}

const BLANK: Fields = {
	hubId: null,
	root: '',
	source: 'working',
	targets: { pr: '', file: '' },
	session: '',
}

const FIELD_ORDER = [
	'hub',
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

// Offline hubs are listed but cannot be opened on: the open would be relayed to nobody.
export function hubToOpenOn(
	picked: string | null,
	hubs: readonly HubRef[],
): string | null {
	const online = hubs.filter(hub => hub.isOnline)
	return online.find(hub => hub.id === picked)?.id ?? online[0]?.id ?? null
}

// The stream names hubs and none of them can take the open. A page whose stream named none yet (a
// local page before its hello) opens on its own hub.
function isEveryHubOffline(hubs: readonly HubRef[]): boolean {
	return hubs.length > 0 && hubs.every(hub => !hub.isOnline)
}

// The hub field shows when it has something to say: a choice (past one hub), or that no hub can
// take the open, which is also its one error, so that error never stands on a field the dialog
// leaves out. With one online hub the open goes to it and the field would only repeat the page.
function isHubAsked(hubs: readonly HubRef[]): boolean {
	return hubs.length > 1 || isEveryHubOffline(hubs)
}

function validate(fields: Fields, hubs: readonly HubRef[]): FieldErrors {
	return {
		...(isEveryHubOffline(hubs) && {
			hub: 'None of your hubs is online. Start one on its machine, then open the desk.',
		}),
		...(!fields.root.trim() && {
			root: "Name the repository's path on the hub's machine.",
		}),
		...(fields.source === 'file' &&
			!fields.targets.file.trim() && {
				target: 'Name the file to review.',
			}),
	}
}

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
	'setHub' | 'setRoot' | 'setSource' | 'setTarget' | 'setSession'
>

function fieldSetters(
	edit: (next: (current: Fields) => Fields) => void,
	clearError: (key: keyof FieldErrors) => void,
): FieldSetters {
	return {
		setHub: hubId => {
			edit(current => ({ ...current, hubId }))
			clearError('hub')
		},
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

// The New review form: its fields, the validation a submit runs, the one action - the open (use-open-desk.ts). While it runs, the fields hold still.
// Each error stands until its field is edited or the next submit; a field the submit did not flag is never shown wanting. A `seed` fills the repository in.
export function useNewReview(
	seed: string | null,
	hubs: readonly HubRef[],
): NewReview {
	const [fields, setFields] = useState(() => ({ ...BLANK, root: seed ?? '' }))
	const [errors, setErrors] = useState(NO_ERRORS)
	const desk = useOpenDesk()
	const hubId = hubToOpenOn(fields.hubId, hubs)
	const setters = fieldSetters(
		next => {
			if (!desk.isBusy) setFields(next)
		},
		key => setErrors(current => ({ ...current, [key]: undefined })),
	)
	return {
		fields,
		hubs,
		hubId,
		asksHub: isHubAsked(hubs),
		...setters,
		errors,
		refusal: desk.refusal,
		isBusy: desk.isBusy,
		submit: event => {
			event.preventDefault()
			if (desk.isBusy) return
			const found = validate(fields, hubs)
			setErrors(found)
			const firstInvalid = FIELD_ORDER.find(key => found[key])
			if (firstInvalid) {
				focusField(event.currentTarget, firstInvalid)
				return
			}
			desk.open(toInput(fields), hubId ?? undefined)
		},
		abort: desk.abort,
	}
}

import {
	EMAIL_FIELD,
	EMAIL_MAX_LENGTH,
	NAME_FIELD,
	NAME_MAX_LENGTH,
} from '../model/endpoint'

// The address field's attributes, the same in every form. `required` and `type` keep the browser's own check for a form posted before its script runs.
export const EMAIL_INPUT = {
	type: 'email',
	name: EMAIL_FIELD,
	required: true,
	maxLength: EMAIL_MAX_LENGTH,
	autoComplete: 'email',
	autoCapitalize: 'none',
	spellCheck: false,
	placeholder: 'you@example.com',
} as const

export const NAME_INPUT = {
	type: 'text',
	name: NAME_FIELD,
	maxLength: NAME_MAX_LENGTH,
	autoComplete: 'given-name',
	placeholder: 'Ada',
} as const

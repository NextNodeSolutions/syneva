import { useState } from 'react'

import { OUTCOME_MESSAGE } from './outcome'
import { postSignup } from './post-signup'
import { EMPTY_SIGNUP, cleanName, isEmail } from './signup'

import type { SubmitEvent } from 'react'
import type { Outcome } from './outcome'
import type { Signup } from './signup'

type Refusal = Exclude<Outcome, 'subscribed'>
type Attempt =
	| { phase: 'editing' }
	| { phase: 'sending' }
	| { phase: 'refused'; outcome: Refusal }

const EDITING: Attempt = { phase: 'editing' }
const MISSING_EMAIL = 'Your email address, so I know where to write.'
const SENDING: Notice = { tone: 'sending', text: 'Sending\u2026' }

// The form's status line: the round trip under way, or a refusal the field cannot fix (too many tries, a failed send).
export type Notice = { tone: 'sending' | 'refused'; text: string }

export type SignupForm = {
	draft: Signup
	edit: (change: Partial<Signup>) => void
	// Shown under the email field; the field is checked once it has been left filled in, or the form sent.
	emailProblem: string | undefined
	notice: Notice | undefined
	isSending: boolean
	checkEmail: () => void
	submit: (event: SubmitEvent<HTMLFormElement>) => void
}

function problemWith(email: string): string | undefined {
	if (email === '') return MISSING_EMAIL
	if (isEmail(email)) return undefined
	return OUTCOME_MESSAGE.invalid
}

function noticeOf(attempt: Attempt): Notice | undefined {
	if (attempt.phase === 'sending') return SENDING
	if (attempt.phase === 'editing' || attempt.outcome === 'invalid')
		return undefined
	return { tone: 'refused', text: OUTCOME_MESSAGE[attempt.outcome] }
}

// The endpoint's word on the address outranks the form's own check.
function emailProblemOf(
	email: string,
	isChecked: boolean,
	refusal: Refusal | undefined,
): string | undefined {
	if (refusal === 'invalid') return OUTCOME_MESSAGE.invalid
	if (!isChecked) return undefined
	return problemWith(email)
}

// One form's draft, its checks and its round trip. A signup the endpoint takes goes to `onJoined`; a refusal keeps everything typed, so a retry is one press, and calls `onRefused` (the form puts the caret back in the address).
export function useSignupForm(
	onJoined: (signup: Signup) => void,
	onRefused: () => void,
): SignupForm {
	const [draft, setDraft] = useState<Signup>(EMPTY_SIGNUP)
	const [isChecked, setIsChecked] = useState(false)
	const [attempt, setAttempt] = useState<Attempt>(EDITING)
	const email = draft.email.trim()
	const refusal = attempt.phase === 'refused' ? attempt.outcome : undefined

	const send = async (form: HTMLFormElement): Promise<void> => {
		setAttempt({ phase: 'sending' })
		const outcome = await postSignup(form)
		if (outcome === 'subscribed') {
			setAttempt(EDITING)
			onJoined({ ...draft, email, name: cleanName(draft.name) })
			return
		}
		setAttempt({ phase: 'refused', outcome })
		onRefused()
	}

	return {
		draft,
		// Held while the signup is on its way: the verdict shows what was sent, so nothing typed after the press may change under it.
		edit: change => {
			if (attempt.phase === 'sending') return
			setDraft(current => ({ ...current, ...change }))
			if (refusal) setAttempt(EDITING)
		},
		emailProblem: emailProblemOf(email, isChecked, refusal),
		notice: noticeOf(attempt),
		isSending: attempt.phase === 'sending',
		checkEmail: () => {
			if (email !== '') setIsChecked(true)
		},
		submit: event => {
			event.preventDefault()
			if (attempt.phase === 'sending') return
			setIsChecked(true)
			if (problemWith(email)) {
				onRefused()
				return
			}
			void send(event.currentTarget)
		},
	}
}

import { useState } from 'react'

import { OUTCOME_MESSAGE } from './outcome'
import { postSignup } from './post-signup'
import { EMPTY_SIGNUP, cleanName, isEmail } from './signup'

import type { RefObject, SubmitEvent } from 'react'
import type { Outcome } from './outcome'
import type { Signup } from './signup'

type Answer = Exclude<Outcome, 'subscribed'>
type Attempt =
	| { phase: 'editing' }
	| { phase: 'sending' }
	| { phase: 'answered'; outcome: Answer }

const EDITING: Attempt = { phase: 'editing' }
const MISSING_EMAIL = 'Your email address, so I know where to write.'
const SENDING: Notice = { tone: 'sending', text: 'Sending\u2026' }

// The form's status line: the round trip under way, a refusal the field cannot fix (too many tries, a failed send), or word that the address already signed up today, which faults nothing.
export type Notice = { tone: 'sending' | 'refused' | 'info'; text: string }

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
	const { outcome } = attempt
	return {
		tone: outcome === 'signed-up-today' ? 'info' : 'refused',
		text: OUTCOME_MESSAGE[outcome],
	}
}

// The endpoint's word on the address outranks the form's own check.
function emailProblemOf(
	email: string,
	isChecked: boolean,
	answer: Answer | undefined,
): string | undefined {
	if (answer === 'invalid') return OUTCOME_MESSAGE.invalid
	if (!isChecked) return undefined
	return problemWith(email)
}

// One form's draft, its checks and its round trip. A signup the endpoint takes goes to `onJoined`; any other answer (a refusal, or word that the address already signed up today) keeps everything typed, so a retry is one press, and puts the caret back in `emailField`.
export function useSignupForm(
	onJoined: (signup: Signup) => void,
	emailField: RefObject<HTMLInputElement | null>,
): SignupForm {
	const [draft, setDraft] = useState<Signup>(EMPTY_SIGNUP)
	const [isChecked, setIsChecked] = useState(false)
	const [attempt, setAttempt] = useState<Attempt>(EDITING)
	const email = draft.email.trim()
	const answer = attempt.phase === 'answered' ? attempt.outcome : undefined

	const send = async (form: HTMLFormElement): Promise<void> => {
		setAttempt({ phase: 'sending' })
		const outcome = await postSignup(form)
		if (outcome === 'subscribed') {
			setAttempt(EDITING)
			onJoined({ ...draft, email, name: cleanName(draft.name) })
			return
		}
		setAttempt({ phase: 'answered', outcome })
		emailField.current?.focus()
	}

	return {
		draft,
		// Held while the signup is on its way: the verdict shows what was sent, so nothing typed after the press may change under it.
		edit: change => {
			if (attempt.phase === 'sending') return
			setDraft(current => ({ ...current, ...change }))
			if (answer) setAttempt(EDITING)
		},
		emailProblem: emailProblemOf(email, isChecked, answer),
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
				emailField.current?.focus()
				return
			}
			void send(event.currentTarget)
		},
	}
}

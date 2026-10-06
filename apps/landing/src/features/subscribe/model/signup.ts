import { EMAIL_MAX_LENGTH, NAME_MAX_LENGTH } from './endpoint'

import type { AgentId } from './agents'

// What one person leaves on the launch list; the name and the agents are optional (empty).
export type Signup = { email: string; name: string; agents: readonly AgentId[] }

export const EMPTY_SIGNUP: Signup = { email: '', name: '', agents: [] }

// The form and the endpoint judge an address by this one rule: the HTML standard's valid e-mail address (what a browser's type="email" accepts, so turning its check off on hydration loosens nothing), with at least one dot in the domain, since mail is not delivered to a bare host.
const EMAIL_PATTERN =
	/^[\w.!#$%&'*+/=?^`{|}~-]+@[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?(?:\.[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?)+$/i
const CONTROL_CHARACTER = /\p{Cc}/u

export const isEmail = (email: string): boolean =>
	email.length <= EMAIL_MAX_LENGTH && EMAIL_PATTERN.test(email)

export const cleanName = (name: string): string =>
	name.trim().replaceAll(/\s+/g, ' ')

export const isName = (name: string): boolean =>
	name.length <= NAME_MAX_LENGTH && !CONTROL_CHARACTER.test(name)

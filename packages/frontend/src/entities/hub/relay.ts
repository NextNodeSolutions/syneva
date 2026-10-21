import { RELAY_FAILURE_STATUS } from '@syneva/contracts/bridge'

import type { ApiError } from '@shared/api/client'
import type { RelayFailure } from '@syneva/contracts/bridge'

// What a relayed request can fail with on the web (RFC 0001, 4.5 and 4.9), as the page tells it
// apart: the hub is not connected, it did not answer in time, the web is carrying too many
// requests for this person, or the answer was over the bound. Each arrives as an error body whose
// `code` names the failure; the codes and their statuses are the contracts', never spelled here.
export type RelayKind = 'offline' | 'timeout' | 'busy' | 'too-large'

// What a desk page keeps standing over its review: the two that say the hub cannot be reached
// right now. The others pass (a toast), since the hub is fine.
export type RelayNotice = Extract<RelayKind, 'offline' | 'timeout'>

const KINDS: Record<RelayFailure, RelayKind> = {
	HUB_OFFLINE: 'offline',
	HUB_TIMEOUT: 'timeout',
	TOO_LARGE: 'too-large',
	TOO_MANY: 'busy',
	// The tab left first: nothing was answered, and the one who sees it is not waiting.
	CANCELLED: 'offline',
}

function isRelayFailure(code: string | undefined): code is RelayFailure {
	return Boolean(code) && Object.hasOwn(KINDS, code ?? '')
}

// The relay failure an API error is, or null for any other refusal (the hub's own answers).
// A 502 is a hub socket that closed under the request, whatever else the body says.
export function relayKindOf(error: ApiError): RelayKind | null {
	if (isRelayFailure(error.code)) return KINDS[error.code]
	if (error.status === RELAY_FAILURE_STATUS.CANCELLED) return 'offline'
	return null
}

export const RELAY_WORDS: Record<RelayKind, string> = {
	offline: 'This hub is offline. Bring it back online, then try again.',
	timeout:
		'The hub did not answer in time. It may still have done what you asked; try again once it responds.',
	busy: 'Too many requests are in flight at once. Try again in a moment.',
	'too-large': 'That answer is too large to carry through the web.',
}

// What a hub keeps for its own machine when the web relays the request (RFC 0001, 7), by the code
// its refusal names: an open of a folder it serves no desk on, or of a pr (which checks the PR out
// there). Its own sentence says what it refused; these say what the reviewer does instead. The
// codes are read as the hub sends them.
const LOCAL_ONLY_WORDS: Readonly<Record<string, string>> = {
	NOT_SERVED:
		'From the web, a desk opens only on a repository this hub already has a live desk on: open any other with syneva open on its machine.',
	PR_LOCAL_ONLY:
		'Open it there with syneva open pr <ref>: the web reviews it once it is open.',
}

export function localOnlyWords(error: ApiError): string | null {
	const { code } = error
	if (!code || !Object.hasOwn(LOCAL_ONLY_WORDS, code)) return null
	return LOCAL_ONLY_WORDS[code] ?? null
}

export function isRelayNotice(kind: RelayKind): kind is RelayNotice {
	return kind === 'offline' || kind === 'timeout'
}

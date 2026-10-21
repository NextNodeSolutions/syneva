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

export function isRelayNotice(kind: RelayKind): kind is RelayNotice {
	return kind === 'offline' || kind === 'timeout'
}

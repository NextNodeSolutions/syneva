// What a desk tab does when the web could not carry one of its requests to the hub (RFC 0001,
// 4.9). Loaded the first time a request is refused, off the first paint's path: a hub that is
// offline or slow stands over the review as a notice, and the failures that leave the hub fine
// (too many requests, an answer too large) are a toast. Nothing here retries: the reviewer does.
import { isRelayNotice, RELAY_WORDS, relayKindOf } from '@entities/hub/relay'

import { S, toast } from './store'

import type { ApiError } from '@shared/api/client'

export function noteRelayFailure(error: ApiError): void {
	const kind = relayKindOf(error)
	if (!kind) return
	if (isRelayNotice(kind)) S.relayNotice = kind
	else toast(RELAY_WORDS[kind])
}

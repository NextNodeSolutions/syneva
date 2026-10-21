// What a desk tab makes of a request the web could not carry to the hub (RFC 0001, 4.9). Loaded
// the first time a request is refused or the first load fails, off the first paint's path: a hub
// that is offline or slow is what the request says of it for the strip over the review
// (relay-notice.ts); the failures that leave the hub fine (too many requests, an answer too large)
// are a toast, and say the hub was reached. Any other refusal says nothing of the hub's reach (the
// web may have refused it for its own reasons). Nothing here retries: the reviewer does.
import { isRelayNotice, RELAY_WORDS, relayKindOf } from '@entities/hub/relay'
import { ApiError } from '@shared/api/client'

import { hearRequest } from './relay-notice'
import { toast } from './store'

export function noteRefusal(error: ApiError, sentAt: number): void {
	const kind = relayKindOf(error)
	if (!kind) return
	if (isRelayNotice(kind)) {
		hearRequest(kind, sentAt)
		return
	}
	toast(RELAY_WORDS[kind])
	hearRequest(null, sentAt)
}

// Whether a desk's first load met its hub offline (main.tsx): the strip says so, and the stream
// reloads the tab once the hub is back. Any other failure is not the relay's to explain.
export function isHubOffline(error: unknown): boolean {
	return error instanceof ApiError && relayKindOf(error) === 'offline'
}

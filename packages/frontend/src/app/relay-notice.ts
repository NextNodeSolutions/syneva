import { S } from './store'

import type { RelayNotice } from '@entities/hub/relay'

// Whether the desk's hub can be reached, as the strip over the review says it (RFC 0001, 4.9),
// from two witnesses: the web's word on the hub's socket, which the stream carries (each `hub`
// frame and each hello of the hub, desk-stream.ts), and the desk's own requests, which the web
// answers for the hub (main.tsx; a refusal is read in desk-relay.ts). Each speaks for the moment
// it was given, a request for when it was sent (the web judged the hub then, however late the
// answer comes back), and the strip says what the newest says: the hub offline, slow to answer,
// or nothing. So a refusal shaped before the web said the hub is back never outlives that word,
// and the strip leaves once the hub is heard of again or a newer request was answered. Locally
// no request is relayed and the stream says nothing of the kind: the strip never shows.
type Word = { notice: RelayNotice | null; at: number }

let hub: Word | null = null
let request: Word | null = null

function settle(): void {
	const newest = request && (!hub || request.at > hub.at) ? request : hub
	S.relayNotice = newest?.notice ?? null
}

// The web said, now, where the hub stands: offline (its socket is closed) or reachable (null).
export function hearHub(notice: RelayNotice | null): void {
	hub = { notice, at: performance.now() }
	settle()
}

// A desk request sent at `sentAt` was answered (null) or met the hub's notice. An answer that
// comes back after a newer request's says nothing newer.
export function hearRequest(notice: RelayNotice | null, sentAt: number): void {
	if (request && request.at > sentAt) return
	request = { notice, at: sentAt }
	settle()
}

// The reviewer read the slow hub's notice (only that one is dismissed): it leaves, as if the
// request had been answered.
export function installRelayNoticeBindings(): void {
	S.dismissRelayNotice = () => {
		if (request) hearRequest(null, request.at)
	}
}

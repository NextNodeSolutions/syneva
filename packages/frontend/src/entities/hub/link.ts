import { CLOSE_CODES } from '@syneva/contracts/bridge'

import type { StreamClose, StreamState } from '@shared/api/stream'
import type { HubIdentity } from './model'

// How the hub answers, as every surface says it: still reaching it for the first time, live, held
// off (not answering, or asking this page to wait: too many tabs, saturated; a listing the page
// holds goes stale meanwhile), or this browser signed out.
export type HubStatus =
	| 'connecting'
	| 'live'
	| 'unreachable'
	| 'too-many'
	| 'saturated'
	| 'signed-out'

// The stream waits before its next attempt, and the page shows what it holds as stale
// (isHeldOff, held.ts).
export type HeldStatus = Extract<
	HubStatus,
	'unreachable' | 'too-many' | 'saturated'
>

// The stream as the Hub page shows it: how the hub answers and since when, the hub on the other
// end, why the last socket ended and when the next attempt goes.
export type HubLink = {
	status: HubStatus
	liveSince: number | null
	retryAt: number | null
	lastClose: StreamClose | null
	identity: HubIdentity | null
}

// An attempt after a close that named a wait reads as that wait until it is answered, so a page
// asked to wait does not flicker to "not answering" each time it tries again.
function heldBy(lastClose: StreamClose): HeldStatus {
	if (lastClose.code === CLOSE_CODES.tooMany) return 'too-many'
	if (lastClose.code === CLOSE_CODES.saturated) return 'saturated'
	return 'unreachable'
}

// A stream reaching the hub again after a drop is not answering yet: only the very first attempt
// reads as connecting, so a page holding a listing never flashes back to its loading state.
export function hubStatus({ link, lastClose }: StreamState): HubStatus {
	if (link.kind === 'live' || link.kind === 'signed-out') return link.kind
	if (link.kind === 'too-many' || link.kind === 'saturated') return link.kind
	if (!lastClose) return 'connecting'
	return heldBy(lastClose)
}

export function hubLink(
	stream: StreamState,
	identity: HubIdentity | null,
): HubLink {
	const { link } = stream
	return {
		status: hubStatus(stream),
		liveSince: link.kind === 'live' ? link.since : null,
		retryAt: 'retryAt' in link ? link.retryAt : null,
		lastClose: stream.lastClose,
		identity,
	}
}

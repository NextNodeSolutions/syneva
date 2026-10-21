import type { StreamClose, StreamState } from '@shared/api/stream'
import type { HubIdentity } from './model'

// How the hub answers, as every surface says it: still reaching it for the first time, live,
// not answering (the stream backs off; a listing it holds goes stale), or this browser signed out.
export type HubStatus = 'connecting' | 'live' | 'unreachable' | 'signed-out'

// The stream as the Hub page shows it: how the hub answers and since when, the hub on the other
// end, why the last socket ended and when the next attempt goes.
export type HubLink = {
	status: HubStatus
	liveSince: number | null
	retryAt: number | null
	lastClose: StreamClose | null
	identity: HubIdentity | null
}

// A stream reaching the hub again after a drop is not answering yet: only the very first attempt
// reads as connecting, so a page holding a listing never flashes back to its loading state.
export function hubStatus({ link, lastClose }: StreamState): HubStatus {
	if (link.kind === 'live' || link.kind === 'signed-out') return link.kind
	if (link.kind === 'connecting' && !lastClose) return 'connecting'
	return 'unreachable'
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

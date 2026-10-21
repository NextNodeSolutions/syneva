// The bridge (RFC 0001, section 4): the frames a hub pushes to the tabs watching it, its paths,
// its bounds and its close codes. One vocabulary for every push transport: the local hub's
// stream (`GET /api/hub/ws`), the probe a paired hub opens to the web, and the web's tab
// sockets. JSON text frames, each at most `BRIDGE_LIMITS.frameBytes`.
import { HUB_PATHS } from './routes.js'

import type { DeskStatus, PollPayload } from './browser.js'
import type { DeskSummary, HubEvent } from './hub.js'
import type { PlanSummary } from './plans.js'

// The hub id the local hub speaks for itself; a paired hub speaks its web id instead (RFC 4.8).
export const LOCAL_HUB_ID = 'local'

// Who a hub is: the first frame of every stream. `instanceId` changes on every hub start.
export type HubIdentity = {
	id: string
	// The machine's hostname.
	name: string
	// The CLI version the hub runs.
	version: string
	instanceId: string
	startedAt: string
}

// What a desk tab watches between two reads of its state: the payload `/poll` serves (the poll
// fields and the desk's status) and the desk's instance id, which `/poll` compares through its
// `?instance=` query and a stream carries instead (RFC 4.8): a new one asks the tab to refresh.
export type DeskPulse = PollPayload &
	DeskStatus & {
		serverInstanceId: string
	}

// The part of a pulse whose size does not grow with the review: a hash, a flag, the desk's
// status (its activity line is capped) and the instance id, a few hundred bytes whatever the desk
// holds. Everything else - the guide, where it stands against the diff, the conversation - grows
// with the review; a field added to DeskPulse joins those unless it is picked here.
export type DeskPulseHead = Pick<
	DeskPulse,
	'baseDiffHash' | 'guideExpected' | 'serverInstanceId' | keyof DeskStatus
>

// A pulse whose whole frame would pass `frameBytes` (a long conversation, a large guide) travels
// as its head and `partial`: frames are bounded by design, so such a desk neither goes unheard
// nor closes its readers' sockets. `digest` moves whenever a part left out moves; a tab reads the
// whole pulse at GET /api/desks/<id>/pulse (API_PATHS.pulse) when the digest is not the one it
// last read, never on a timer. A whole pulse carries no `partial`.
export type PartialDeskPulse = DeskPulseHead & {
	partial: { digest: string }
}

export type RelayMethod = 'GET' | 'POST' | 'DELETE'

export type RelayFailure =
	| 'HUB_TIMEOUT'
	| 'HUB_OFFLINE'
	| 'TOO_LARGE'
	| 'CANCELLED'

export type BridgeFrame =
	// First frame after connect.
	| { t: 'hello'; hub: HubIdentity }
	// A desk opened, reloaded or restored, or its summary changed.
	| { t: 'desk'; hubId: string; desk: DeskSummary }
	| { t: 'closed'; hubId: string; deskId: string }
	// A desk's pulse changed: coalesced per desk, latest wins; partial when the whole would not fit
	// a frame.
	| {
			t: 'pulse'
			hubId: string
			deskId: string
			pulse: DeskPulse | PartialDeskPulse
	  }
	// Journal events once on disk, oldest first, each with its hub's own seq: a reader keys them
	// on (hubId, seq), so a tail replayed after a reconnect deduplicates.
	| { t: 'journal'; hubId: string; events: HubEvent[] }
	// A plan record created or changed (a new version, an approval, a status change), with the
	// live desk reviewing it when the frame was shaped. The `desk` frames keep that link as desks
	// come and go: a desk whose `plan` names the record reviews it, until its `closed` frame. An
	// addition to RFC 4.4: the dashboard read the plan library on a timer, and the stream
	// replaces that read too.
	| { t: 'plan'; hubId: string; plan: PlanSummary }
	// Closes a snapshot: `hello`, one `desk` and one `pulse` per desk, the journal tail, every
	// plan, then this.
	| { t: 'snapshot-end'; hubId: string }
	// The web's object tells its tabs a hub socket opened or closed.
	| { t: 'hub'; hubId: string; name: string; online: boolean }
	// The object asks a hub for a snapshot.
	| { t: 'snapshot?' }
	// The HTTP relay (RFC 4.5): one request, its answer (chunked past `chunkBytes`), its failure,
	// its cancellation.
	| {
			t: 'req'
			id: string
			method: RelayMethod
			path: string
			query: string
			body?: string | undefined
	  }
	| {
			t: 'res'
			id: string
			status: number
			headers: Record<string, string>
			body?: string | undefined
			more?: true | undefined
	  }
	| { t: 'chunk'; id: string; data: string; more?: true | undefined }
	| { t: 'err'; id: string; code: RelayFailure }
	| { t: 'cancel'; id: string }
	// Ping and pong.
	| { t: 'p' }
	| { t: 'o' }

// A ping and its pong, as the exact text on the wire: the web answers this pair with the
// object's auto-response, which matches the text, so every hub accepts exactly this spelling.
export const PING_TEXT = '{"t":"p"}'
export const PONG_TEXT = '{"t":"o"}'

export const BRIDGE_PATHS = {
	deviceCode: '/bridge/v1/device/code',
	deviceToken: '/bridge/v1/device/token',
	hubSocket: '/bridge/v1/ws',
	tabSocket: HUB_PATHS.hubSocket,
	opsBreaker: '/bridge/v1/ops/breaker',
	opsStatus: '/bridge/v1/ops/status',
} as const

const PING_INTERVAL_MS = 30_000
const PONG_TIMEOUT_MS = 10_000
// The pings a socket may miss before it reads as gone: a background tab's timers may be throttled
// to once a minute, so one ping can come a whole interval late.
const MISSABLE_PINGS = 2

// Every bound of the bridge; a hub keeps them locally too, so the same bug is found locally first.
export const BRIDGE_LIMITS = {
	frameBytes: 1_048_576,
	chunkBytes: 786_432,
	responseBytes: 33_554_432,
	requestBodyBytes: 1_048_576,
	inFlightPerUser: 32,
	deadlineMs: 30_000,
	// Inbound, per socket, sustained: one second's worth is the burst.
	framesPerSecond: 100,
	bytesPerSecond: 2_097_152,
	hubsPerUser: 8,
	tabsPerUser: 32,
	pingIntervalMs: PING_INTERVAL_MS,
	pongTimeoutMs: PONG_TIMEOUT_MS,
	// Inbound silence a socket may keep (70 s): past it the hub closes it with `silent`, so a
	// laptop asleep, a link dropped half-open or a frozen tab holds neither its subscription nor a
	// seat among `tabsPerUser`. A client pings every `pingIntervalMs`.
	silenceMs: PING_INTERVAL_MS * MISSABLE_PINGS + PONG_TIMEOUT_MS,
	coalesceMs: 250,
	// What a reader may leave unread before a live frame is queued behind it (8 MiB, eight frames
	// at the bound): past it the hub closes it with `slow`, rather than growing by every frame
	// sent its way. A snapshot goes whole whatever its size, and live frames wait until it is
	// written out, so only a reader that cannot keep up with the events is closed.
	bufferedBytes: 8_388_608,
	journalTail: 200,
	journalPerFrame: 200,
	backoffMinMs: 1_000,
	backoffMaxMs: 60_000,
} as const

// The client policy per code is RFC 4.3's. `goingAway` is the standard code a hub closes its
// sockets with when it stops. A client reconnects with the normal backoff after any code that
// names no wait of its own, `silent` and `slow` among them.
export const CLOSE_CODES = {
	goingAway: 1001,
	malformed: 1003,
	rate: 1008,
	tooMany: 1013,
	revoked: 4001,
	// Nothing came from the socket within `silenceMs`, as HTTP's 408 says of a request: its peer
	// is gone, or its tab was frozen and reconnects once it runs again.
	silent: 4008,
	// The reader left more than `bufferedBytes` unread: it reconnects and starts over from a fresh
	// snapshot, which says the latest state once instead of every step it missed.
	slow: 4010,
	saturated: 4029,
} as const
